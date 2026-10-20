import { render, screen, waitFor } from '@testing-library/react';
import App from './App';
import { getLeagueTable, getRounds } from './api';

jest.mock('./api', () => ({
  getRounds: jest.fn(),
  getLeagueTable: jest.fn(),
  getTeamScores: jest.fn(),
}));

beforeEach(() => {
  getRounds.mockResolvedValue({
    data: [
      { roundId: 2, name: 'Week 1' },
      { roundId: 5, name: 'Week 2' },
    ],
  });
  getLeagueTable.mockResolvedValue({
    data: [{ teamId: 1, teamName: 'Team A', totalPoints: 10 }],
  });
});

test('renders the league table for the latest round', async () => {
  render(<App />);

  expect(screen.getByText('League Table')).toBeInTheDocument();
  expect(await screen.findByText('Team A')).toBeInTheDocument();
  await waitFor(() => expect(getLeagueTable).toHaveBeenCalledWith(5));
  expect(screen.getByRole('combobox')).toHaveDisplayValue('Week 2');
});
