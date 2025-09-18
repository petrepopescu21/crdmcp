import { CRDLoader } from './crd-loader.js';
import { SampleLoader } from './sample-loader.js';
import { InstructionLoader } from './instruction-loader.js';
import type { LoadedData, ServerConfig } from '../types/index.js';
import { Logger } from '../utils/logger.js';
import { validateDataDirectory } from '../config/index.js';

export class DataLoader {
  private logger: Logger;

  constructor(private config: ServerConfig) {
    this.logger = new Logger(config.verbose);
  }

  async loadAllData(): Promise<LoadedData> {
    const startTime = Date.now();
    this.logger.info(`🚀 Loading data from: ${this.config.dataDir}`);

    // Validate data directory structure
    const validation = validateDataDirectory(this.config.dataDir);

    if (validation.warnings.length > 0) {
      validation.warnings.forEach((warning) => this.logger.warn(warning));
    }

    if (!validation.valid) {
      validation.errors.forEach((error) => this.logger.error(error));
      throw new Error('Data directory validation failed');
    }

    // Initialize loaders
    const crdLoader = new CRDLoader(this.config.dataDir, this.logger);
    const sampleLoader = new SampleLoader(this.config.dataDir, this.logger);
    const instructionLoader = new InstructionLoader(
      this.config.dataDir,
      this.logger
    );

    // Load all data in parallel
    this.logger.debug('Starting parallel data loading...');

    const [crdResult, sampleResult, instructionResult] = await Promise.all([
      crdLoader.loadCRDs(),
      sampleLoader.loadSamples(),
      instructionLoader.loadInstructions(),
    ]);

    // Compile results
    const allErrors = [
      ...crdResult.errors,
      ...sampleResult.errors,
      ...instructionResult.errors,
    ];

    const allWarnings = [
      ...crdResult.warnings,
      ...sampleResult.warnings,
      ...instructionResult.warnings,
    ];

    const loadTime = Date.now() - startTime;

    const loadedData: LoadedData = {
      crds: crdResult.crds,
      samples: sampleResult.samples,
      instructions: instructionResult.instructions,
      statistics: {
        crdsLoaded: crdResult.crds.size,
        samplesLoaded: Array.from(sampleResult.samples.values()).reduce(
          (sum, arr) => sum + arr.length,
          0
        ),
        instructionsLoaded: instructionResult.instructions.length,
        loadTime,
        errors: allErrors,
        warnings: allWarnings,
      },
    };

    // Log final statistics
    this.logLoadingStatistics(loadedData);

    return loadedData;
  }

  private logLoadingStatistics(data: LoadedData): void {
    const { statistics } = data;

    this.logger.success('📊 Data loading completed!');
    this.logger.info(`   CRDs: ${statistics.crdsLoaded}`);
    this.logger.info(`   Samples: ${statistics.samplesLoaded}`);
    this.logger.info(`   Instructions: ${statistics.instructionsLoaded}`);
    this.logger.info(`   Load time: ${statistics.loadTime}ms`);

    if (statistics.errors.length > 0) {
      this.logger.warn(`   Errors: ${statistics.errors.length}`);
      if (this.config.verbose) {
        statistics.errors.forEach((error) =>
          this.logger.error(`     ${error}`)
        );
      }
    }

    if (statistics.warnings.length > 0) {
      this.logger.warn(`   Warnings: ${statistics.warnings.length}`);
      if (this.config.verbose) {
        statistics.warnings.forEach((warning) =>
          this.logger.warn(`     ${warning}`)
        );
      }
    }
  }
}

export * from './crd-loader.js';
export * from './sample-loader.js';
export * from './instruction-loader.js';
