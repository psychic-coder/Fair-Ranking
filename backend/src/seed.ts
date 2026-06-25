import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { processTransaction } from './services/transactionService';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fair-ranking';

const seedData = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB for seeding...');

    console.log('Creating demo transactions for 100 users...');
    

    for (let i = 1; i <= 100; i++) {
      const txCount = Math.floor(Math.random() * 5) + 1; 
      for (let j = 0; j < txCount; j++) {
        await processTransaction({
          userId: `user_${i}`,
          amount: Math.floor(Math.random() * 1000) + 10,
          type: Math.random() > 0.2 ? 'credit' : 'debit',
          idempotencyKey: uuidv4()
        });
      }
      if (i % 20 === 0) console.log(`Created ${i} users...`);
    }

    // 2. Spammer (will hit the velocity check >20 transactions in 5 min)
    console.log('Creating spammer transactions...');
    for (let i = 0; i < 22; i++) {
      await processTransaction({ userId: 'eve_spammer', amount: 1, type: 'credit', idempotencyKey: uuidv4() });
    }

    console.log('Demo data seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding data:', err);
    process.exit(1);
  }
};

seedData();
