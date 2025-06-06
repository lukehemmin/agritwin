import { Database } from 'sqlite';
import { seedInitialData } from './001_initial_data';

export async function runSeeders(db: Database) {
  console.log('Running database seeders...');
  
  try {
    // 시드 함수들을 순서대로 실행
    await seedInitialData(db);
    
    console.log('All seeders completed successfully');
  } catch (error) {
    console.error('Error running seeders:', error);
    throw error;
  }
}