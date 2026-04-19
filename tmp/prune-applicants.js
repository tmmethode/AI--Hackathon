const path = require('path');
const rootDir = process.cwd();

process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({
  module: 'commonjs',
  moduleResolution: 'node',
});
require(path.join(rootDir, 'backend/node_modules/ts-node/register/transpile-only'));
require(path.join(rootDir, 'backend/node_modules/dotenv')).config({
  path: path.join(rootDir, 'backend/.env'),
});

const mongoose = require(path.join(rootDir, 'backend/node_modules/mongoose'));
const Applicant = require(path.join(rootDir, 'backend/models/Applicant')).default;
const Job = require(path.join(rootDir, 'backend/models/Job')).default;

async function inspect() {
  await mongoose.connect(process.env.MONGODB_URI);

  const total = await Applicant.countDocuments();
  const byJob = await Applicant.aggregate([
    {
      $group: {
        _id: '$job',
        count: { $sum: 1 },
        oldest: { $min: '$createdAt' },
        newest: { $max: '$createdAt' },
      },
    },
    { $sort: { count: -1 } },
  ]);

  const jobs = await Job.find({ _id: { $in: byJob.map((entry) => entry._id) } })
    .select('title applicantsCount')
    .lean();

  const titles = new Map(jobs.map((job) => [String(job._id), job]));

  console.log(
    JSON.stringify(
      {
        total,
        byJob: byJob.map((entry) => ({
          jobId: String(entry._id),
          count: entry.count,
          oldest: entry.oldest,
          newest: entry.newest,
          title: titles.get(String(entry._id))?.title,
          storedApplicantsCount: titles.get(String(entry._id))?.applicantsCount,
        })),
      },
      null,
      2
    )
  );
}

async function prune() {
  await mongoose.connect(process.env.MONGODB_URI);

  const total = await Applicant.countDocuments();
  if (total < 130) {
    throw new Error(`Expected at least 130 applicants, found ${total}.`);
  }

  const toDelete = await Applicant.find({})
    .sort({ createdAt: 1, _id: 1 })
    .limit(100)
    .select('_id job createdAt email firstName lastName')
    .lean();

  const kept = await Applicant.find({})
    .sort({ createdAt: -1, _id: -1 })
    .limit(30)
    .select('_id createdAt email firstName lastName job')
    .lean();

  if (toDelete.length !== 100) {
    throw new Error(`Expected to select 100 applicants for deletion, selected ${toDelete.length}.`);
  }

  const idsToDelete = toDelete.map((entry) => entry._id);
  const deletesByJob = new Map();

  for (const entry of toDelete) {
    const key = String(entry.job);
    deletesByJob.set(key, (deletesByJob.get(key) || 0) + 1);
  }

  const deleteResult = await Applicant.deleteMany({ _id: { $in: idsToDelete } });

  for (const [jobId, count] of deletesByJob.entries()) {
    await Job.findByIdAndUpdate(jobId, { $inc: { applicantsCount: -count } });
  }

  const remaining = await Applicant.countDocuments();

  console.log(
    JSON.stringify(
      {
        deletedCount: deleteResult.deletedCount,
        remaining,
        deletedByJob: Object.fromEntries(deletesByJob),
        keptSample: kept.slice(0, 5).map((entry) => ({
          id: String(entry._id),
          email: entry.email,
          createdAt: entry.createdAt,
          jobId: String(entry.job),
          name: `${entry.firstName} ${entry.lastName}`.trim(),
        })),
      },
      null,
      2
    )
  );
}

async function main() {
  const mode = process.argv[2];

  if (mode !== 'inspect' && mode !== 'prune') {
    throw new Error("Usage: node tmp/prune-applicants.js <inspect|prune>");
  }

  if (mode === 'inspect') {
    await inspect();
  } else {
    await prune();
  }
}

main()
  .catch(async (error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await mongoose.disconnect();
    } catch {}
  });
