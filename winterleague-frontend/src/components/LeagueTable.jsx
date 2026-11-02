import React, { useState, useEffect } from 'react';
import TeamScores from './TeamScores';
import { getLeagueTable, getRounds } from '../api';

const headerCell = 'p-2 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-medium text-white uppercase';
const bodyCell = 'p-2 sm:px-4 sm:py-3 text-xs sm:text-base whitespace-nowrap';

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
                    <td className={bodyCell}>
                      <span className="text-blue-600 hover:text-blue-900 font-semibold underline">
                        {team.teamName}
                      </span>
                    </td>
                    <td className={bodyCell}>{team.totalPoints}</td>
                  </tr>

                  {expandedTeamId === team.teamId && (
                    <tr>
                      <td colSpan={3} className="p-0">
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
