// src/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api', // adjust to your API host
});

export const getLeagueTable = (roundId) => roundId ? api.get(`/league/table?roundId=${roundId}`) : api.get('/league/table') ;
export const getTeamScores = (teamId, roundId) => api.get(`/league/team-scores?teamId=${teamId}&roundId=${roundId}`);
export const getRounds = () => api.get('league/rounds')
