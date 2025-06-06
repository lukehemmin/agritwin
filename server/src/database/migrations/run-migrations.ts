import { Database } from 'sqlite';
import fs from 'fs';
import path from 'path';

export async function runMigrations(db: Database) {
  console.log('Running database migrations...');
  
  // migrations 디렉토리에서 .sql 파일들을 읽어서 실행
  const migrationsDir = __dirname;
  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort(); // 파일명 순서대로 실행
  
  for (const file of migrationFiles) {
    console.log(`Running migration: ${file}`);
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    // SQL 파일을 세미콜론으로 분리해서 개별 실행
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (const statement of statements) {
      try {
        await db.exec(statement.trim());
      } catch (error) {
        console.error(`Error executing statement in ${file}:`, error);
        console.error('Statement:', statement.trim());
        throw error;
      }
    }
    
    console.log(`✓ Migration ${file} completed`);
  }
  
  console.log('All migrations completed successfully');
}