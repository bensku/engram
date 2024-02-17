import { MongoClient } from 'mongodb';

const mongo = new MongoClient(process.argv[2]).db(process.argv[3]);
void mongo.dropDatabase().then(() => process.exit(0));
