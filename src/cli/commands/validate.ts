import { existsSync } from 'fs';
import { resolve } from 'path';
import { validateDataDirectory } from '../../config/index.js';
import { DataLoader } from '../../loaders/index.js';
import type { ServerConfig } from '../../types/index.js';
import { Logger } from '../../utils/logger.js';

interface ValidateOptions {
  'data-dir': string;
  verbose?: boolean;
  strict?: boolean;
}

export async function validateCommand(argv: ValidateOptions) {
  const logger = new Logger(argv.verbose);

  try {
    const dataDir = resolve(argv['data-dir']);
    const validationProgress = logger.startProgress('CRD Validation');

    logger.info(`🔍 Validating CRD data directory: ${dataDir}`);

    // Check if directory exists
    if (!existsSync(dataDir)) {
      validationProgress.fail('Directory does not exist');
      logger.error(`Data directory does not exist: ${dataDir}`);
      process.exit(1);
    }

    validationProgress.update(1, 6, 'Directory exists');

    let hasErrors = false;
    let hasWarnings = false;

    // Validate directory structure
    logger.info('📁 Checking directory structure...');
    const structureValidation = validateDataDirectory(dataDir);

    validationProgress.update(2, 6, 'Directory structure checked');

    // Use enhanced logging for validation results
    logger.logValidationResult(
      'Directory structure',
      structureValidation.errors,
      structureValidation.warnings,
      argv.strict
    );

    if (structureValidation.errors.length > 0) {
      hasErrors = true;
    }

    if (structureValidation.warnings.length > 0) {
      hasWarnings = true;
      if (argv.strict) {
        hasErrors = true;
      }
    }

    // Validate data loading
    logger.info('📊 Validating data loading...');
    validationProgress.update(3, 6, 'Starting data loading validation');

    const config: ServerConfig = {
      dataDir,
      verbose: argv.verbose || false,
    };

    try {
      const dataLoader = new DataLoader(config);
      const loadedData = await dataLoader.loadAllData();

      validationProgress.update(4, 6, 'Data loading completed');

      // Use enhanced logging for data loading validation results
      logger.logValidationResult(
        'Data loading',
        loadedData.statistics.errors,
        loadedData.statistics.warnings,
        argv.strict
      );

      if (loadedData.statistics.errors.length > 0) {
        hasErrors = true;
      }

      if (loadedData.statistics.warnings.length > 0) {
        hasWarnings = true;
        if (argv.strict) {
          hasErrors = true;
        }
      }

      // Validation summary
      logger.info('📈 Validation Summary:');
      logger.info(`   CRDs loaded: ${loadedData.statistics.crdsLoaded}`);
      logger.info(`   Samples loaded: ${loadedData.statistics.samplesLoaded}`);
      logger.info(
        `   Instructions loaded: ${loadedData.statistics.instructionsLoaded}`
      );
      logger.info(`   Load time: ${loadedData.statistics.loadTime}ms`);

      // Additional validation checks
      logger.info('🔬 Running additional validation checks...');
      validationProgress.update(5, 6, 'Running additional checks');

      // Check for orphaned samples (samples without corresponding CRDs)
      const orphanedSamples: string[] = [];
      for (const [kind] of loadedData.samples) {
        const hasCRD = Array.from(loadedData.crds.values()).some(
          (crd) => crd.kind === kind
        );
        if (!hasCRD) {
          orphanedSamples.push(kind);
        }
      }

      logger.logValidationResult(
        'Orphaned samples',
        [],
        orphanedSamples.map(
          (kind) => `Sample kind '${kind}' has no corresponding CRD`
        ),
        argv.strict
      );

      if (orphanedSamples.length > 0) {
        hasWarnings = true;
        if (argv.strict) {
          hasErrors = true;
        }
      }

      // Check for CRDs without samples
      const crdsWithoutSamples: string[] = [];
      for (const [, crd] of loadedData.crds) {
        if (!loadedData.samples.has(crd.kind)) {
          crdsWithoutSamples.push(crd.kind);
        }
      }

      if (crdsWithoutSamples.length > 0 && argv.verbose) {
        logger.info('ℹ️  CRDs without sample manifests:');
        crdsWithoutSamples.forEach((kind) => {
          logger.info(`   • ${kind}`);
        });
      }

      // Check for duplicate CRD names across different groups
      const kindCounts = new Map<string, string[]>();
      for (const [, crd] of loadedData.crds) {
        if (!kindCounts.has(crd.kind)) {
          kindCounts.set(crd.kind, []);
        }
        kindCounts.get(crd.kind)!.push(crd.group);
      }

      const duplicateKinds: string[] = [];
      for (const [kind, groups] of kindCounts) {
        if (groups.length > 1) {
          duplicateKinds.push(`${kind} (groups: ${groups.join(', ')})`);
        }
      }

      if (duplicateKinds.length > 0) {
        hasWarnings = true;
        logger.warn('⚠️  Duplicate resource kinds across groups:');
        duplicateKinds.forEach((duplicate) => {
          logger.warn(`   • ${duplicate}`);
        });
      }
    } catch (error) {
      hasErrors = true;
      logger.error('❌ Failed to load data:', error);
    }

    // Final result
    validationProgress.update(6, 6, 'Validation complete');

    if (hasErrors) {
      validationProgress.fail('Validation failed with errors');
      logger.error('❌ Validation failed with errors');
      process.exit(1);
    } else if (hasWarnings && !argv.strict) {
      validationProgress.complete('Validation completed with warnings');
      logger.warn('⚠️  Validation completed with warnings');
      process.exit(0);
    } else {
      validationProgress.complete('Validation passed successfully');
      logger.success('✅ Validation passed successfully');
      process.exit(0);
    }
  } catch (error) {
    logger.error('Failed to validate directory:', error);
    process.exit(1);
  }
}
