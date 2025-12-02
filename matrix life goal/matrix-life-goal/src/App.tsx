import { Auth } from './components/Auth';
import { Grid } from './components/Grid';
import { WhoopCallback } from './components/WhoopCallback';

function App() {
  // Simple routing - check if we're on the WHOOP callback page
  const isWhoopCallback = window.location.pathname.includes('whoop-callback');

  if (isWhoopCallback) {
    return (
      <Auth>
        <WhoopCallback />
      </Auth>
    );
  }

  return (
    <Auth>
      <Grid />
    </Auth>
  );
}

export default App;
