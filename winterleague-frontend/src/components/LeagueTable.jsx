import React, { useState, useEffect } from 'react';
import TeamScores from './TeamScores';
import { getLeagueTable, getRounds } from '../api';
import './LeagueTable.css'; // ensure this is imported

export default function LeagueTable() {
  const [table, setTable] = useState([]);
  const [expandedTeamId, setExpandedTeamId] = useState(null);
  const [rounds, setRounds] = useState([]);
  const [selectedRound, setSelectedRound] = useState(null);

  // Fetch rounds on mount
  useEffect(() => {
    getRounds().then(res => {
      setRounds(res.data);
      setSelectedRound(res.data.length);
    });
  }, []);

  // Fetch league table whenever selectedRound changes
  useEffect(() => {
    if (selectedRound != null) {
      getLeagueTable(selectedRound).then(res => setTable(res.data));
    }
  }, [selectedRound]);

  const handleTeamClick = (teamId) => {
    setExpandedTeamId(prev => (prev === teamId ? null : teamId));
  };

  return (
    <div className="table-container p-4">
      <h2 className="text-3xl font-bold mb-4 text-center text-blue-800">League Table</h2>

      {/* Round selector */}
      <div className="mb-4">
        <label className="mr-2 font-semibold">Select Round:</label>
        <select
          value={selectedRound || ''}
          onChange={e => setSelectedRound(Number(e.target.value))}
          className="border px-2 py-1 rounded"
        >
          <option value="">Latest</option>
          {rounds.map(r => (
            <option key={r.roundId} value={r.roundId}>{r.name}</option>
          ))}
        </select>
      </div>

      {/* League table */}
        <table className="league-table min-w-full divide-y divide-gray-200">
          <thead className="bg-blue-700">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-medium text-white uppercase">Pos</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-white uppercase">Team</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-white uppercase">Pts</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {table.map((team, index) => (
              <React.Fragment key={team.teamId}>
                <tr
                  className="hover:bg-blue-50 cursor-pointer"
                  onClick={() => handleTeamClick(team.teamId)}
                >
                  <td className="px-3 py-4 whitespace-nowrap">{index + 1}</td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    <span className="text-blue-600 hover:text-blue-900 font-semibold underline">
                      {team.teamName}
                    </span>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">{team.totalPoints}</td>
                </tr>

                {expandedTeamId === team.teamId && (
                  <tr>
                    <td colSpan={3} className="p-0">
                      <div className="team-scores-container">
                        <TeamScores
                          team={team}
                          roundId={selectedRound}
                          onClose={() => setExpandedTeamId(null)}
                        />
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
    </div>
  );
}
