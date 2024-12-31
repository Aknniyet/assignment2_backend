const express = require('express');
const SpotifyWebApi = require('spotify-web-api-node');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Initialize Spotify API client
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
});

// Middleware to serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.json());

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Route to search for songs
app.post('/search', async (req, res) => {
  const query = req.body.query;

  try {
    // Authorization before the request
    const credentials = await spotifyApi.clientCredentialsGrant();
    spotifyApi.setAccessToken(credentials.body['access_token']); // Setting the access token

    const data = await spotifyApi.searchTracks(query);
    const tracks = data.body.tracks.items;

    // Map results to the format we need
    const results = tracks.map(track => ({
      name: track.name,
      artists: track.artists.map(artist => artist.name).join(', '),
      album: track.album.name,
      release_date: track.album.release_date || 'Unknown', 
      image: track.album.images[0]?.url || '', 
      popularity: track.popularity,
      duration_ms: track.duration_ms,
      preview_url: track.preview_url,
      link: track.external_urls.spotify,
    }));

    res.json(results);
  } catch (error) {
    console.error('Error fetching data from Spotify API:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
