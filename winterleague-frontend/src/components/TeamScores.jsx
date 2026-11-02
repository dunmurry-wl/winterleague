import React, { useEffect, useState } from 'react';
import { getTeamScores } from '../api';

export default function TeamScores({ team, roundId, onClose }) {
    const [scores, setScores] = useState([]);
    const teamId = team?.teamId;

    useEffect(() => {
        if (teamId == null || roundId == null) return;
        getTeamScores(teamId, roundId)
            .then(setScores)
            .catch(err => console.error(err));
    }, [teamId, roundId]);

    const qualifyingTotal = scores
        .filter(g => g.qualifying)
        .reduce((sum, g) => sum + (g.bestScore ?? 0), 0);

    const rowClass = (g, index) => {
        if (g.qualifying) return 'bg-green-100 font-semibold';
        return index % 2 ? 'bg-gray-50' : 'bg-white';
    };

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
                    <tbody className="divide-y divide-gray-200">
                        {scores.map((g, index) => (
                            <tr key={g.golferId} className={`${rowClass(g, index)} hover:bg-blue-50`}>
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
