const { google } = require('googleapis');
const readline = require('readline');
const fs = require('fs');
const google_info = require('./client_secret_850956705920-2koejam39juttj7vag3q29gski74rd1r.apps.googleusercontent.com.json');

// Replace these values with your own credentials
const CLIENT_ID = google_info.web.client_id;
const CLIENT_SECRET = google_info.web.client_secret;
const REDIRECT_URI = google_info.web.redirect_uris[0];


const TIME_ZONE = 'America/Chicago';
// Scope for Google Calendar API
const SCOPES = ['https://www.googleapis.com/auth/calendar'];

// Create an OAuth2 client
const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

// Generate an authentication URL
const authUrl = oAuth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES,
});

console.log('Authorize this app by visiting this URL:', authUrl);

// Read the authorization code from standard input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('Enter the authorization code from that page here: ', (code) => {
  rl.close();

  // Exchange authorization code for access token
  oAuth2Client.getToken(code, (err, token) => {
    if (err) return console.error('Error retrieving access token', err);

    oAuth2Client.setCredentials(token);

    // Create Google Calendar API instance
    const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

    // Create a new calendar
    calendar.calendars.insert({
      requestBody: {
        summary: 'Workplace Project Deadlines',
        timeZone: TIME_ZONE,
      },
    }, (err, res) => {
      if (err) return console.error('Error creating calendar:', err);
      const calendarId = res.data.id;
      // Share the calendar with team members
      calendar.acl.insert({
        calendarId: calendarId,
        requestBody: {
          role: 'writer',
          scope: {
            type: 'domain',
            value: 'your_domain.com',
          },
        },
      }, (err, res) => {
        if (err) return console.error('Error sharing calendar:', err);
        console.log('Calendar created and shared successfully.');
        // Set up custom alerts
        calendar.events.update({
          calendarId: calendarId,
          eventId: 'primary', // Use primary event ID for the main calendar
          requestBody: {
            reminders: {
              useDefault: false,
              overrides: [
                { method: 'email', minutes: 60 }, // 1 hour before the event
                { method: 'popup', minutes: 30 }, // 30 minutes before the event
              ],
            },
          },
        }, (err, res) => {
          if (err) return console.error('Error setting reminders:', err);
          console.log('Custom alerts set up successfully.');
        });
      });
    });
  });
});