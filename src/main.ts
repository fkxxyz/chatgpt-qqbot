import * as yargs from 'yargs';
import * as fs from 'fs';
import {App} from "./app";

let argv = yargs.option('config', {
    alias: 'c',
    describe: 'Path to configuration file',
    demandOption: true,
    type: 'string',
    default: './.test.config.json',
}).argv;

let configPath = argv.config
let config
try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
} catch (err) {
    console.error(`Failed to load config file "${configPath}": ${err.message}`);
    process.exit(1);
}

const app = new App(config)
app.main()