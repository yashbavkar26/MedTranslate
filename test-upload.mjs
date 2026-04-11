import fs from 'fs';

const fileBuf = fs.readFileSync('./frontend/package.json');
const fileBlob = new Blob([fileBuf], { type: 'application/pdf' });
const formData = new FormData();
formData.append('report', fileBlob, 'test.pdf');
formData.append('language', 'Hindi');

fetch('http://localhost:8000/api/upload-report', {
  method: 'POST',
  body: formData
})
.then(res => res.json())
.then(data => {
  console.log("Language detected/handled:");
  console.log(data);
});
