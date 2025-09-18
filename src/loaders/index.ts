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
    const progress = this.logger.startProgress('Data Loading');

    const result = await this.logger.group('Loading CRD data', async () => {
      this.logger.info(`🚀 Loading data from: ${this.config.dataDir}`);

      // Validate data directory structure
      const validation = validateDataDirectory(this.config.dataDir);

      this.logger.logValidationResult(
        'Directory structure',
        validation.errors,
        validation.warnings
      );

      if (!validation.valid) {
        progress.fail('Directory validation failed');
        throw new Error('Data directory validation failed');
      }

      progress.update(1, 4, 'Directory validated');

      // Initialize loaders with contextual loggers
      const crdLogger = this.logger.withContext('CRD');
      const sampleLogger = this.logger.withContext('Sample');
      const instructionLogger = this.logger.withContext('Instruction');

      const crdLoader = new CRDLoader(this.config.dataDir, crdLogger);
      const sampleLoader = new SampleLoader(this.config.dataDir, sampleLogger);
      const instructionLoader = new InstructionLoader(
        this.config.dataDir,
        instructionLogger
      );

      progress.update(2, 4, 'Loaders initialized');

      // Load all data in parallel
      this.logger.debug('Starting parallel data loading...');

      const [crdResult, sampleResult, instructionResult] = await Promise.all([
        crdLoader.loadCRDs(),
        sampleLoader.loadSamples(),
        instructionLoader.loadInstructions(),
      ]);

      progress.update(3, 4, 'Data loaded');

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

      // Log performance metrics
      this.logger.logPerformanceMetrics({
        'Total load time': loadTime,
      });

      // Log final statistics
      this.logLoadingStatistics(loadedData);

      progress.complete('All data loaded successfully');
      return loadedData;
    });

    return result;
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

export async function loadAllData(dataDir: string): Promise<LoadedData> {
  const config: ServerConfig = {
    dataDir,
    verbose: false,
  };
  const loader = new DataLoader(config);
  return loader.loadAllData();
}
