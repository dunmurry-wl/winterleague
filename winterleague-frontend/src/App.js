import React from 'react';
import LeagueTable from './components/LeagueTable';

function App() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center">
      {/* Fixed full viewport background, dimmed for readability */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-top bg-no-repeat brightness-[.7]"
        style={{ backgroundImage: `url(${process.env.PUBLIC_URL}/images/background.jpg)` }}
      />

      {/* Overlay for translucency */}
      <div className="fixed inset-0 z-0 bg-white/60" />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center w-full">
        <img
          src={`${process.env.PUBLIC_URL}/images/crest.png`}
          alt="Dunmurry Winter League Logo"
          className="w-[150px] mb-4"
        />
        <h1 className="text-center text-5xl">Winter League</h1>
        <LeagueTable />
      </div>
    </div>
  );
}

export default App;
