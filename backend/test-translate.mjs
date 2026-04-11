import { translate } from '@vitalets/google-translate-api';

async function run() {
  const text = 'Hello world';
  try {
    const resHi = await translate(text, { to: 'hi' });
    console.log("Hindi:", resHi.text);
    const resTa = await translate(text, { to: 'ta' });
    console.log("Tamil:", resTa.text);
    const resGom = await translate(text, { to: 'gom' }).catch(e => ({ text: 'gom failed: ' + e.message }));
    console.log("Konkani (gom):", resGom.text);
  } catch(e) {
    console.error(e);
  }
}
run();
