import React, { useEffect, useState } from 'react';
import { getTeamScores } from '../api';

export default function TeamScores({ team, roundId, onClose }) {
    const [scores, setScores] = useState([]);

    useEffect(() => {
        if (!team || !roundId) {
            console.log('no team or roundId - not fetching')    
            return;
        } // avoid fetching if missing
        getTeamScores(team.teamId, roundId)
            .then(res => setScores(res.data))
            .catch(err => console.error(err));
    }, [team, roundId]);

const qualifyingTotal = scores
    .filter(g => g.qualifying)
    .reduce((sum, g) => sum + (g.bestScore ?? 0), 0);

    return (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg shadow-md max-w-3xl mx-auto">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-semibold text-gray-800">
  Weekly Score: {qualifyingTotal}
</h3>
                <button
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-800"
                    onClick={onClose}
                >
                    Close
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-blue-700">
                        <tr>
                            <th className="px-2 py-2 text-left text-white uppercase text-xs">Golfer</th>
                            <th className="px-2 py-2 text-left text-white uppercase text-xs">Score</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {scores.map((g, index) => (
                            <tr
                                key={g.golferId}
                                className={`
        odd:bg-white even:bg-gray-50
        hover:bg-blue-50
        ${g.qualifying ? 'bg-green-100 font-semibold' : ''}
      `}
                            >
                                <td className="px-2 py-2">{g.golferName}</td>
                                <td className="px-2 py-2">{g.bestScore}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
