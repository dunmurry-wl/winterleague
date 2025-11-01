import React, { useState, useEffect } from 'react';
import TeamScores from './TeamScores';
import { getLeagueTable, getRounds } from '../api';

export default function LeagueTable() {
  // State declarations
  const [table, setTable] = useState([]); // league table
  const [selectedTeam, setSelectedTeam] = useState(null); // currently selected team
  const [rounds, setRounds] = useState([]); // list of rounds for dropdown
  const [selectedRound, setSelectedRound] = useState(null); // currently selected round

  // Fetch rounds on mount
  useEffect(() => {
    getRounds().then(res => setRounds(res.data));
  }, []);

  // Fetch league table whenever selectedRound changes
  useEffect(() => {
    getLeagueTable(selectedRound).then(res => setTable(res.data));
  }, [selectedRound]);

  return (
    <div className="max-w-4xl mx-auto p-4">
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
      <div className="overflow-x-auto shadow-lg rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-blue-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Position</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Team</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Total Points</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {table.map((team, index) => (
              <tr
                key={team.teamId}
                className="odd:bg-white even:bg-gray-50 hover:bg-blue-50"
              >
                <td className="px-6 py-4 whitespace-nowrap">{index + 1}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    className="text-blue-600 hover:text-blue-900 font-semibold underline"
                    onClick={() => setSelectedTeam(team)}
                  >
                    {team.teamName}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{team.totalPoints}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Team scores for selected team */}
      {selectedTeam && (
        <TeamScores
          team={selectedTeam}
          roundId={selectedRound}
          onClose={() => setSelectedTeam(null)}
        />
      )}
    </div>
  );
}
