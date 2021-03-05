import chalk from 'chalk';
import Fuse from 'fuse.js';

export function findJsonDuplicatesFromFiles(jsonArray, options) {
  const dict = findJsonDuplicates(jsonArray, options);
  generateOutput(dict, options);
}

export function findJsonDuplicates(jsonArray, options) {
  const dict = {};
  jsonArray.forEach(file => {
    if (!!options.values) {
      mapPropertyValues(true, options, dict, file.json, file.filename);
      mapPropertyValues(false, options, dict, file.json, file.filename);
    } else {
      mapPropertyKeys(true, options, dict, file.json, file.filename);
      mapPropertyKeys(false, options, dict, file.json, file.filename);
    }
  });
  if (!!options.bothKeysAndValues) pruneUnlikeMatches(dict, options);
  return dict;
}

const mapPropertyKeys = (indexPhase, options, dict, json, filename, path) => {
  let newPath;
  Object.keys(json).forEach(k => {
    newPath = !!path ? path + '.' + k : k;
    if (Array.isArray(json[k])) {
      //TODO handle array
    } else if (typeof json[k] === 'object' && json[k] !== null) {
      mapPropertyKeys(indexPhase, options, dict, json[k], filename, newPath);
    } else {
      if (indexPhase) {
        if (!dict.hasOwnProperty(k)) dict[k] = [];
      } else {
        fuzzyMatch(Object.keys(dict), k, options.threshold, r => {
          if (checkFuzzyResult(r, k, options)) dict[r.item].push({key: k, value: json[k], keyPath: newPath, file: filename, score: r.score});
        });
      }
    }
  })
}

const mapPropertyValues = (indexPhase, options, dict, json, filename, path) => {
  let newPath;
  Object.keys(json).forEach(k => {
    newPath = !!path ? path + '.' + k : k;
    if (Array.isArray(json[k])) {
      //TODO handle array
    } else if (typeof json[k] === 'object' && json[k] !== null) {
      mapPropertyValues(indexPhase, options, dict, json[k], filename, newPath);
    } else {
      if (indexPhase) {
        if (!dict.hasOwnProperty(json[k])) dict[json[k]] = [];
      } else {
        fuzzyMatch(Object.keys(dict), json[k], options.threshold, r => {
          if (checkFuzzyResult(r, json[k], options)) dict[r.item].push({key: k, value: json[k],keyPath: newPath, file: filename, score: r.score});
        });
      }
    }
  })
}

const pruneUnlikeMatches = (dict, options) => {
  let matches, valueField;
  Object.keys(dict).forEach(k => {
    matches = [];
    dict[k].forEach((v, idx) => {
      valueField = !options.values ? 'value' : 'key';
      fuzzyMatch(dict[k].map(o => o[valueField]), v[valueField], options.threshold, r => {
        if (r.refIndex !== idx) {
          if (checkFuzzyResult(r, v[valueField], options)) {
            matches.push([idx, r.refIndex]);
          }
        }
      });
    })
    matches = [...new Set(matches.flat())];
    for (let i = dict[k].length - 1; i >= 0; i--) {
      if (!matches.includes(i)) dict[k].splice(i, 1);
    }
  });
}

const fuzzyMatch = (list, term, threshold, onMatch) => {
  const fuse = new Fuse(list, {includeScore:true, threshold: threshold});
  fuse.search(term).forEach(onMatch);
}

const checkFuzzyResult = (result, compareVal, options) => {
  return (Math.abs(compareVal.length - result.item.length) <= 3 && (options.threshold - result.score >= 0));
}

const generateOutput = (dict, options) => {
  let numDupes = 0;
  Object.keys(dict).forEach(k => {
    if (dict[k].length > 1) {
      ++numDupes;
      console.log('----------------------------------------');
      console.log('');
      if (!!options.values)
        console.log(chalk.yellow(chalk.gray('Value:') + ` ${k}`));
      else
        console.log(chalk.yellow(chalk.gray('Key:') + ` ${k}`));
      dict[k].forEach(m => {
        console.log('');
        if (!!m.key) console.log(chalk.gray('Key:') + ` ${m.key}`);
        if (!!m.value) console.log(chalk.gray('Value:') + ` ${m.value}`);
        if (!!m.keyPath && m.keyPath !== m.key) console.log(chalk.gray('Path:') + `  ${m.keyPath}`);
        if (!!m.file) console.log(chalk.gray('File:') + `  ${m.file}`);
        if (!!m.score) console.log(chalk.gray('Score:') + `  ${m.score}`);
      });
      console.log('');
    }
  })
  console.log('----------------------------------------');
  console.log('');
  console.log('✨ Done');
  console.log('');
  if (numDupes === 0) {
    console.log(chalk.green('No duplicates found 🎉'));
    return;
  } else {
    console.log(chalk.yellow(`${numDupes} duplicates found!`));
  }
}
