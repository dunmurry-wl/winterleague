import React, { useState, useEffect } from 'react';
import TeamScores from './TeamScores';
import Tooltip from './Tooltip';
import { getLeagueTable, getRounds } from '../api';

const headerCell = 'p-2 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-medium text-white uppercase';
const cellLayout = 'p-2 sm:px-4 sm:py-3 whitespace-nowrap';
const bodyCell = `${cellLayout} text-xs sm:text-base`;
const primaryCell = `${bodyCell} font-bold`;
const scoreTotalCell = `${cellLayout} text-[0.6875rem] sm:text-sm text-gray-600 tabular-nums`;

function formatRoundScore(team, table) {
  const scores = team.countbackScores ?? [];
  let countbackDepth = 0;

  for (const rival of table) {
    if (rival.teamId === team.teamId || rival.roundScore !== team.roundScore) continue;
    const rivalScores = rival.countbackScores ?? [];
    const differingIndex = Array.from({ length: Math.max(scores.length, rivalScores.length) })
      .findIndex((_, index) => scores[index] !== rivalScores[index]);
    countbackDepth = Math.max(countbackDepth, differingIndex + 1);
  }

  const countback = Array.from({ length: countbackDepth }, (_, index) => {
    const score = scores[index];
    return score == null ? '—' : `${score >= 0 ? '+' : ''}${score}`;
  });
  return `${team.roundScore ?? 0}${countback.length ? ` (${countback.join(', ')})` : ''}`;
}

export default function LeagueTable() {
  const [table, setTable] = useState([]);
  const [expandedTeamId, setExpandedTeamId] = useState(null);
  const [rounds, setRounds] = useState([]);
  const [selectedRound, setSelectedRound] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch rounds on mount and default to the latest one (rounds are ordered by start date)
  useEffect(() => {
    getRounds()
      .then(rounds => {
        setRounds(rounds);
        if (rounds.length > 0) {
          setSelectedRound(rounds[rounds.length - 1].roundId);
        }
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  // Fetch league table whenever selectedRound changes
  useEffect(() => {
    if (selectedRound != null) {
      getLeagueTable(selectedRound).then(setTable).catch(setError);
    }
  }, [selectedRound]);

  const handleTeamClick = (teamId) => {
    setExpandedTeamId(prev => (prev === teamId ? null : teamId));
  };

  return (
    <div className="w-[95%] min-[1600px]:w-[85%] max-w-[1400px] my-5 mx-auto p-4 rounded-xl overflow-x-auto shadow-[0_4px_12px_rgba(0,0,0,0.1)] bg-white/35 backdrop-blur-sm">
      <h2 className="text-3xl font-bold mb-4 text-center text-blue-800">League Table</h2>

      {error && <p className="text-center text-red-700">Sorry, the league table couldn't be loaded.</p>}
      {!error && !loading && rounds.length === 0 && (
        <p className="text-center">No rounds have been set up yet - check back soon.</p>
      )}

      {!error && rounds.length > 0 && (
        <>
          {/* Round selector */}
          <div className="mb-4">
            <label className="mr-2 font-semibold">Select Round:</label>
            <select
              value={selectedRound ?? ''}
              onChange={e => setSelectedRound(Number(e.target.value))}
              className="border px-2 py-1 rounded"
            >
              {rounds.map(r => (
                <option key={r.roundId} value={r.roundId}>{r.name}</option>
              ))}
            </select>
          </div>

          {/* League table */}
          <table className="w-full border-collapse">
            <thead className="bg-[rgba(25,118,210,0.85)]">
              <tr>
                <th className={headerCell}>Pos</th>
                <th className={headerCell}>Team</th>
                <th className={headerCell}>
                  <Tooltip label="Scores">
                    <p>The selected week’s total of the best four golfers’ scores.</p>
                    <p className="mt-2">If totals are tied, compare the fifth-best score, then the sixth, and so on until the tie is broken. Teams still tied share the higher position.</p>
                    <p className="mt-2">Parentheses show the countback scores used, best first: 133 (+25) beats 133 (+23). These scores are not added to the qualifying total. A dash (—) means no further score.</p>
                    <p className="mt-2">Pts shows the team’s cumulative league points through the selected week.</p>
                  </Tooltip>
                </th>
                <th className={headerCell}>Pts</th>
              </tr>
            </thead>
            <tbody>
              {table.map((team, index) => (
                <React.Fragment key={team.teamId}>
                  <tr
                    className={`${index % 2 ? 'bg-neutral-100/60' : 'bg-white/60'} hover:bg-blue-50/60 cursor-pointer`}
                    onClick={() => handleTeamClick(team.teamId)}
                  >
                    <td className={bodyCell}>{index + 1}</td>
                    <td className={primaryCell}>
                      <span className="text-blue-600 hover:text-blue-900 underline">
                        {team.teamName}
                      </span>
                    </td>
                    <td className={scoreTotalCell}>{formatRoundScore(team, table)}</td>
                    <td className={`${primaryCell} tabular-nums`}>{team.totalPoints}</td>
                  </tr>

                  {expandedTeamId === team.teamId && (
                    <tr>
                      <td colSpan={4} className="p-0">
                        <TeamScores
                          team={team}
                          roundId={selectedRound}
                          onClose={() => setExpandedTeamId(null)}
                        />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
