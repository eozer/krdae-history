importScripts('https://cdn.jsdelivr.net/pyodide/v0.17.0/full/pyodide.js');

// async function loadPyodideAndPackages(){
//     await loadPyodide({ indexURL : 'https://cdn.jsdelivr.net/pyodide/v0.17.0/full/' });
//     await self.pyodide.loadPackage(['matplotlib']);
// }
// let pyodideReadyPromise = loadPyodideAndPackages();

const loadPyodidePackagesAndRunCode = async (packages, code) => {
  try {
    console.log(packages, code)
    await loadPyodide({ indexURL : 'https://cdn.jsdelivr.net/pyodide/v0.17.0/full/' });
    await self.pyodide.loadPackage(packages)
    const results = await self.pyodide.runPython(code);
    postMessage({ results: { type: 'loaded', value: true }, });
  } catch (error) {
    postMessage({ error: { type: 'loaded', value: false },});
  }
};

const runPython = (code) => {
  try {
    // eslint-disable-next-line no-restricted-globals
    self.pyodide.runPython(code);
    postMessage({ results: { type: 'code', value: true } });
  } catch (error) {
    postMessage({ error: { type: 'code', value: false } });
  }
};

const getObject = (name) => {
  const obj = self.pyodide.globals.get(name)
  if (obj) {
    postMessage({ results: { type: 'object', value: obj, name: name } });
  } else {
    postMessage({ error: { type: 'object', name: name } });
  }
};

self.onmessage = async(event) => {
  const data = event.data;
  console.log('recevied from main thread ', event.data);
  const { command, arg, globals } = data;
  if (globals) {
    const keys = Object.keys(globals);
    for (let key of keys) {
      if (key !== 'python') {
        // Keys other than python must be arguments for the python script.
        // Set them on self, so that `from js import key` works.
        // eslint-disable-next-line no-restricted-globals
        self[key.toString()] = globals[key];
      }
    }
  }
  switch (command) {
    case 'loadPyodide':
      await loadPyodidePackagesAndRunCode(arg.packages, arg.code);
      break;
    case 'runPython':
      runPython(arg);
      break;
    // // case 'runPythonWithGlobals':
    // //   runPythonWithGlobals(globals, arg);
    // //   break;
    case 'getObject':
      getObject(arg);
      break;
    default:
      console.log('no pyodide command');
  }
}