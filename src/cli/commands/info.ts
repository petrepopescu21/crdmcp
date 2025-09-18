import { existsSync } from 'fs';
import { resolve } from 'path';
import { DataLoader } from '../../loaders/index.js';
import { Logger } from '../../utils/logger.js';
import type { ServerConfig } from '../../types/index.js';

interface InfoOptions {
  'data-dir': string;
  format?: 'table' | 'json' | 'yaml';
  verbose?: boolean;
}

export async function infoCommand(argv: InfoOptions) {
  const logger = new Logger(argv.verbose);

  try {
    const dataDir = resolve(argv['data-dir']);

    if (!existsSync(dataDir)) {
      logger.error(`Data directory does not exist: ${dataDir}`);
      process.exit(1);
    }

    logger.info(`📊 Loading data from: ${dataDir}`);

    const config: ServerConfig = {
      dataDir,
      verbose: argv.verbose || false,
    };

    const dataLoader = new DataLoader(config);
    const loadedData = await dataLoader.loadAllData();

    // Prepare data for output
    const info = {
      directory: dataDir,
      statistics: {
        crds: loadedData.statistics.crdsLoaded,
        samples: loadedData.statistics.samplesLoaded,
        instructions: loadedData.statistics.instructionsLoaded,
        loadTime: `${loadedData.statistics.loadTime}ms`,
        errors: loadedData.statistics.errors.length,
        warnings: loadedData.statistics.warnings.length,
      },
      crds: Array.from(loadedData.crds.entries()).map(([key, crd]) => ({
        key,
        group: crd.group,
        kind: crd.kind,
        plural: crd.plural,
        scope: crd.scope,
        versions: crd.versions,
        shortNames: crd.shortNames || [],
        category: crd.category || 'uncategorized',
        description: crd.description,
        samplesAvailable: loadedData.samples.get(crd.kind)?.length || 0,
      })),
      samples: Array.from(loadedData.samples.entries()).map(
        ([kind, samples]) => ({
          kind,
          count: samples.length,
          complexities: [...new Set(samples.map((s) => s.complexity))],
          tags: [...new Set(samples.flatMap((s) => s.tags))],
        })
      ),
      instructions: loadedData.instructions.map((inst) => ({
        title: inst.title,
        tags: inst.tags,
        applicableCRDs: inst.detectedCRDs,
        category: (inst.frontmatter as any)?.category || 'general',
        priority: (inst.frontmatter as any)?.priority || 1,
      })),
    };

    // Output based on format
    switch (argv.format) {
      case 'json':
        console.log(JSON.stringify(info, null, 2));
        break;

      case 'yaml':
        // Simple YAML output without external dependency
        console.log('---');
        console.log(`directory: "${info.directory}"`);
        console.log('statistics:');
        Object.entries(info.statistics).forEach(([key, value]) => {
          console.log(
            `  ${key}: ${typeof value === 'string' ? `"${value}"` : value}`
          );
        });
        console.log('crds:');
        info.crds.forEach((crd) => {
          console.log(`  - key: "${crd.key}"`);
          console.log(`    group: "${crd.group}"`);
          console.log(`    kind: "${crd.kind}"`);
          console.log(`    scope: "${crd.scope}"`);
          console.log(`    samplesAvailable: ${crd.samplesAvailable}`);
        });
        break;

      case 'table':
      default:
        // Table format (default)
        console.log('\n📈 CRD Directory Information');
        console.log('━'.repeat(80));
        console.log(`📁 Directory: ${info.directory}`);
        console.log(`⏱️  Load Time: ${info.statistics.loadTime}`);

        if (info.statistics.errors > 0 || info.statistics.warnings > 0) {
          console.log(`❌ Errors: ${info.statistics.errors}`);
          console.log(`⚠️  Warnings: ${info.statistics.warnings}`);
        }

        console.log('\n📊 Summary Statistics');
        console.log('─'.repeat(40));
        console.log(`CRDs: ${info.statistics.crds}`);
        console.log(`Samples: ${info.statistics.samples}`);
        console.log(`Instructions: ${info.statistics.instructions}`);

        if (info.crds.length > 0) {
          console.log('\n🔧 Custom Resource Definitions');
          console.log('─'.repeat(80));
          console.log(
            'Kind'.padEnd(20) +
              'Group'.padEnd(25) +
              'Scope'.padEnd(12) +
              'Samples'
          );
          console.log('─'.repeat(80));
          info.crds.forEach((crd) => {
            console.log(
              crd.kind.padEnd(20) +
                crd.group.padEnd(25) +
                crd.scope.padEnd(12) +
                crd.samplesAvailable.toString()
            );
          });
        }

        if (info.samples.length > 0) {
          console.log('\n📋 Sample Manifests');
          console.log('─'.repeat(60));
          console.log(
            'Resource Kind'.padEnd(20) + 'Count'.padEnd(8) + 'Complexities'
          );
          console.log('─'.repeat(60));
          info.samples.forEach((sample) => {
            console.log(
              sample.kind.padEnd(20) +
                sample.count.toString().padEnd(8) +
                sample.complexities.join(', ')
            );
          });
        }

        if (info.instructions.length > 0) {
          console.log('\n📚 Instruction Documents');
          console.log('─'.repeat(80));
          console.log(
            'Title'.padEnd(30) + 'Category'.padEnd(15) + 'Applicable CRDs'
          );
          console.log('─'.repeat(80));
          info.instructions.forEach((inst) => {
            console.log(
              inst.title.substring(0, 29).padEnd(30) +
                inst.category.padEnd(15) +
                inst.applicableCRDs.join(', ')
            );
          });
        }

        if (argv.verbose) {
          console.log('\n🏷️  All Available Tags');
          console.log('─'.repeat(40));
          const allTags = new Set([
            ...info.samples.flatMap((s) => s.tags),
            ...info.instructions.flatMap((i) => i.tags),
          ]);
          console.log(Array.from(allTags).sort().join(', '));

          console.log('\n📂 Categories');
          console.log('─'.repeat(40));
          const categories = new Set([
            ...info.crds.map((c) => c.category),
            ...info.instructions.map((i) => i.category),
          ]);
          console.log(Array.from(categories).sort().join(', '));
        }

        console.log('\n' + '━'.repeat(80));
        break;
    }

    // Show errors and warnings if any
    if (loadedData.statistics.errors.length > 0) {
      logger.error('❌ Errors encountered:');
      loadedData.statistics.errors.forEach((error) => {
        logger.error(`   • ${error}`);
      });
    }

    if (loadedData.statistics.warnings.length > 0) {
      logger.warn('⚠️  Warnings:');
      loadedData.statistics.warnings.forEach((warning) => {
        logger.warn(`   • ${warning}`);
      });
    }
  } catch (error) {
    logger.error('Failed to get directory info:', error);
    process.exit(1);
  }
}
