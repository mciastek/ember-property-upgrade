import fs from 'fs';
import path from 'path';

export const getFixtureFile = (fileName: string) => {
  const filePath = path.resolve(__dirname, `./fixtures/${fileName}`);

  return fs.readFileSync(filePath, 'utf8');
};
