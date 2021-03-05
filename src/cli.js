#!/usr/bin/env node
import chalk from 'chalk'
import commandLineArgs from 'command-line-args'
import commandLineUsage from 'command-line-usage'
import fs from 'fs'
import glob from 'glob'

import {findJsonDuplicatesFromFiles} from './index'

const defOption = [
  {
    name: 'fileglob',
    type: String,
    defaultOption: true,
    typeLabel: '{underline glob}',
    description: 'The glob path to the JSON files. ex. path/to/the/**/*-files.json'
  }
];

const sections = [
  {
    header: 'Find duplicated keys or values in json files.',
    content: 'List all duplicates (including nested) keys or values across JSON files, using exact or fuzzy matching.\n\nExample:\nnode ./build/cli path/to/the/**/*-files.json'
  },
  {
    header: 'Options',
    optionList: [
      {
        alias: 'v',
        name: 'values',
        type: Boolean,
        typeLabel: '{underline boolean}',
        description: 'Find duplicate values instead of keys'
      },
      {
        alias: 'b',
        name: 'bothKeysAndValues',
        type: Boolean,
        typeLabel: '{underline boolean}',
        description: 'Compare both keys and values for duplicates'
      },
      {
        alias: 't',
        name: 'threshold',
        type: Number,
        defaultValue: 0.0,
        typeLabel: '{underline number}',
        description: 'Fuzzy threshold, 0.0 - 1.0. Default is 0.0, which is a (case-insensitive) substring match. See https://fusejs.io/api/options.html#threshold for more information.'
      },
      {
        alias: 'h',
        name: 'help',
        type: Boolean,
        typeLabel: '{underline boolean}',
        description: 'Show this help.'
      }
    ]
  }
]

const options = commandLineArgs(defOption.concat(sections[1].optionList));

const runCli = (options) => {
  if (options == null || options.fileglob == null) {
    console.log(commandLineUsage(sections));
    return 0;
  } else {
    const jsonFilePath = options.fileglob;
    try {
      const jsonFiles = glob.sync(jsonFilePath, {});
      if (!jsonFiles || !jsonFiles.length) {
        console.log(`No JSON files found.`);
        return 0;
      }
      const jsonArray = [];
      let parsed, parseErr;
      jsonFiles.every(f => {
        try {
          parsed = JSON.parse(fs.readFileSync(f));
          jsonArray.push({filename: f, json: parsed});
          return true;
        } catch (err) {
          parseErr = true;
          console.log(chalk.red(`Unable to read/parse JSON file: ${f}`));
          console.log(chalk.red(err));
          return false;
        }
      });
      if (!!parseErr) return 1;
      console.log('');
      console.log(`Processing ${jsonArray.length} JSON files(s)`);
      console.log('');
      findJsonDuplicatesFromFiles(jsonArray, options);
    } catch (err) {
      console.log(chalk.red(err));
      return 1;
    }
  }
}

process.exit(runCli(options))
