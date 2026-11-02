import { render, screen, waitFor } from '@testing-library/react';
import App from './App';
import { getLeagueTable, getRounds } from './api';

vi.mock('./api', () => ({
  getRounds: vi.fn(),
  getLeagueTable: vi.fn(),
  getTeamScores: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  getLeagueTable.mockResolvedValue([{ teamId: 1, teamName: 'Team A', totalPoints: 10 }]);
});

test('renders the league table for the latest round', async () => {
  // Rounds arrive ordered by start date; the last one is the latest
  getRounds.mockResolvedValue([
    { roundId: 5, name: 'Week 1' },
    { roundId: 2, name: 'Week 2' },
  ]);
  render(<App />);

  expect(screen.getByText('League Table')).toBeInTheDocument();
  expect(await screen.findByText('Team A')).toBeInTheDocument();
  await waitFor(() => expect(getLeagueTable).toHaveBeenCalledWith(2));
  expect(screen.getByRole('combobox')).toHaveDisplayValue('Week 2');
});

test('shows a message before any rounds are set up', async () => {
  getRounds.mockResolvedValue([]);
  render(<App />);

  expect(await screen.findByText(/no rounds have been set up/i)).toBeInTheDocument();
  expect(getLeagueTable).not.toHaveBeenCalled();
});

test('shows an error if the database fails to load', async () => {
  getRounds.mockRejectedValue(new Error('404'));
  render(<App />);

  expect(await screen.findByText(/couldn't be loaded/i)).toBeInTheDocument();
});
