import React from 'react';
import LeagueTable from './components/LeagueTable';

function App() {
  return (
    <div style={{ padding: '20px' }}>
      <h1 className='text-center' style={{fontSize: '3' + 'em'}}>Dunmurry Winter League</h1>
      <LeagueTable />
    </div>
  );
}

export default App;
