import { render, screen, waitFor, within } from '@testing-library/react';
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

test.each([
  ['fifth-best scores', [25], [23], '133 (+25)', '133 (+23)'],
  ['sixth-best scores', [25, 20], [25, 18], '133 (+25, +20)', '133 (+25, +18)'],
  ['missing scores', [0], [], '133 (+0)', '133 (—)'],
  ['negative scores', [-1], [], '133 (-1)', '133 (—)'],
  ['unbroken ties', [25, 20], [25, 20], '133', '133'],
])('shows weekly totals with %s', async (_name, firstScores, secondScores, firstDisplay, secondDisplay) => {
  getRounds.mockResolvedValue([{ roundId: 1, name: 'Week 1' }]);
  getLeagueTable.mockResolvedValue([
    { teamId: 1, teamName: 'Team A', totalPoints: 36, roundScore: 133, countbackScores: firstScores },
    { teamId: 2, teamName: 'Team B', totalPoints: 34, roundScore: 133, countbackScores: secondScores },
    { teamId: 3, teamName: 'Team C', totalPoints: 14, roundScore: 120, countbackScores: [23] },
  ]);
  render(<App />);

  const firstRow = (await screen.findByText('Team A')).closest('tr');
  const secondRow = screen.getByText('Team B').closest('tr');
  expect(screen.getByRole('columnheader', { name: 'Score Total' })).toBeInTheDocument();
  expect(within(firstRow).getByText(firstDisplay)).toBeInTheDocument();
  expect(within(secondRow).getByText(secondDisplay)).toBeInTheDocument();
  expect(within(firstRow).getByText('36')).toBeInTheDocument();
  expect(screen.getByText('120')).toBeInTheDocument();
  expect(screen.queryByText('120 (+23)')).not.toBeInTheDocument();
});
