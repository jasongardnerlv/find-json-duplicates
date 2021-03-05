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
        const fuse = new Fuse(Object.keys(dict), {includeScore:true, threshold: options.threshold});
        fuse.search(k).forEach(r => {
          if (Math.abs(k.length - r.item.length) <= 3 && (options.threshold - r.score >= 0))
            dict[r.item].push({key: k, value: json[k], keyPath: newPath, file: filename, score: r.score});
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
        const fuse = new Fuse(Object.keys(dict), {includeScore:true, threshold: options.threshold});
        fuse.search(json[k]).forEach(r => {
          if (Math.abs(json[k].length - r.item.length) <= 3 && (options.threshold - r.score >= 0))
            dict[r.item].push({key: k, value: json[k],keyPath: newPath, file: filename, score: r.score});
        });
      }
    }
  })
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
