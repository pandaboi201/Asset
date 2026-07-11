const fs = require('fs');
const db = fs.readFileSync('dev.db');
// This is a binary file, but table schema is stored as plain text inside sqlite_master!
// I'll just print out all CREATE TABLE statements.
const strings = db.toString('ascii').match(/CREATE TABLE [^;]+;/g);
console.log(strings ? strings.join('\n\n') : 'No tables found');
