const { assertFails, assertSucceeds, initializeTestEnvironment } = require('@firebase/rules-unit-testing');
const fs = require('fs');

async function run() {
  const testEnv = await initializeTestEnvironment({
    projectId: 'gestaopro-761e1',
    firestore: {
      rules: fs.readFileSync('firestore.rules', 'utf8')
    }
  });

  console.log("Environment initialized");
}
run();
