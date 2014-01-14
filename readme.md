This little script runs in the Google App Script environment.

Specifically it runs in [Googles Spreadsheets][0].  It lets you suck down your Fitbit data and the do all kinds of analysis.  It's also an easy way to get started with the Fitbit API.

Sadly to get started is a bit of a pain.
First you need to create a Fitbit API key and secret.

1. Create a new google spreadsheet
2. Go to Tools->Script Editor->Create Script for Spreadsheet. This will open the Script Editor in another tab.
3. Replace the template with fitbit.js and press the save button (the icon looks like a floppy disk)
4. Select function 'renderFitbitConfigurationDialog' and the press play to run the function. You will need to authorize your account. Then Go to the tab containing your spreadsheet. There should be a dialog box where you can enter your consumer key and secret.
5. Enter your credentials
6. Run the "authorize" function -- this will run through the oauth dance.
7. Run the "refreshTimeSeries" function to get your data into your spreadsheet.
8. Export as CSV to use in D3 graphs. 
