import React from 'react';
import './App.css'; 
import LeagueTable from './components/LeagueTable';

function App() {
  return (
    <div className="App">
      {/* Fixed full viewport background */}
      <div
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: `url(${process.env.PUBLIC_URL}/images/background.jpg)`,
          backgroundSize: 'cover',
          backgroundPosition: 'top center',
          backgroundRepeat: 'no-repeat',
          width: '100%',
          height: '100vh',
          filter: 'brightness(0.7)',       // optional dim for readability
        }}
      />
      
      {/* Overlay for translucency */}
      <div
        className="fixed inset-0 z-0"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.6)',
        }}
      />
      {/* Logo */}
        

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center w-full">
        <img
          src={`${process.env.PUBLIC_URL}/images/crest.png`}
          alt="Dunmurry Winter League Logo"
          style={{ width: '150px', marginBottom: '16px' }} // adjust size and spacing
        />
        <h1 className="text-center" style={{ fontSize: '3em' }}>Winter League</h1>
        <LeagueTable />
      </div>
    </div>
  );
}

export default App;
