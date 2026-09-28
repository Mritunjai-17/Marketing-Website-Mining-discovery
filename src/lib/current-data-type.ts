export type DataStatus =
  | "actual"
  | "guidance"
  | "forecast"
  | "estimate"
  | "unknown";

export type ProductionBasis =
  | "100%"
  | "attributable"
  | "equity"
  | "unknown";

export type CurrentDataRow = {
  rank?: number;
  name: string;
  value: number;
  unit: string;
  metric: string;
  year?: number;
  period?: string;
  status: DataStatus;
  productionBasis?: ProductionBasis;
  asOf?: string;
  sourceName: string;
  sourceUrl: string;
};

export type CanonicalDataset = {
  type:
    | "ranking"
    | "comparison"
    | "price"
    | "production"
    | "reserves"
    | "resources";

  title: string;
  metric: string;
  unit: string;
  asOf?: string;
  period?: string;
  rows: CurrentDataRow[];
  sourceCount: number;
};

export type DatasetValidationError = {
  code:
    | "NO_ROWS"
    | "INVALID_VALUE"
    | "MISSING_SOURCE"
    | "MIXED_PERIOD"
    | "MIXED_YEAR"
    | "MIXED_STATUS"
    | "MIXED_PRODUCTION_BASIS"
    | "DUPLICATE_NAME"
    | "INVALID_YEAR"
    | "FUTURE_YEAR"
    | "UNIT_MISMATCH"
    | "METRIC_MISMATCH"
    | "RANK_ERROR";

  message: string;
  row?: CurrentDataRow;
};

export type DatasetValidationResult = {
  valid: boolean;
  errors: DatasetValidationError[];
  warnings: string[];
};


/**
 * Get the effective period of a row.
 */
function getRowPeriod(row: CurrentDataRow): string {

  if (row.period?.trim()) {
    return row.period.trim().toLowerCase();
  }

  if (row.year !== undefined) {
    return String(row.year);
  }

  return "unknown";
}


/**
 * Validate that rows belong to one coherent dataset.
 */
export function validateDataset(
  dataset: CanonicalDataset
): DatasetValidationResult {
  const errors: DatasetValidationError[] = [];
  const warnings: string[] = [];

  const rows = dataset.rows;


  
  // --------------------------------------------------
  // 1. Dataset must contain rows
  // --------------------------------------------------

  if (!rows.length) {
    errors.push({
      code: "NO_ROWS",
      message: "Dataset contains no rows.",
    });

    return {
      valid: false,
      errors,
      warnings,
    };
  }

  // --------------------------------------------------
  // 2. Validate individual rows
  // --------------------------------------------------

  for (const row of rows) {
    if (!row.name?.trim()) {
      errors.push({
        code: "INVALID_VALUE",
        message: "Row has no name.",
        row,
      });
    }

    if (
      typeof row.value !== "number" ||
      !Number.isFinite(row.value)
    ) {
      errors.push({
        code: "INVALID_VALUE",
        message: `Invalid numeric value for "${row.name}".`,
        row,
      });
    }

    if (!row.unit?.trim()) {
      errors.push({
        code: "INVALID_VALUE",
        message: `Missing unit for "${row.name}".`,
        row,
      });
    }

    if (!row.metric?.trim()) {
      errors.push({
        code: "METRIC_MISMATCH",
        message: `Missing metric for "${row.name}".`,
        row,
      });
    }

    if (!row.sourceName?.trim() || !row.sourceUrl?.trim()) {
      errors.push({
        code: "MISSING_SOURCE",
        message: `Missing source for "${row.name}".`,
        row,
      });
    }

    if (
      row.year !== undefined &&
      (
        !Number.isInteger(row.year) ||
        row.year < 1900 ||
        row.year > 2100
      )
    ) {
      errors.push({
        code: "INVALID_YEAR",
        message: `Invalid year "${row.year}" for "${row.name}".`,
        row,
      });
    }
  }

  // --------------------------------------------------
  // 3. Same period
  // --------------------------------------------------

  const periods = new Set(
    rows.map(getRowPeriod)
  );

  if (periods.size > 1) {
    errors.push({
      code: "MIXED_PERIOD",
      message:
        `Dataset contains multiple periods: ${[
          ...periods,
        ].join(", ")}.`,
    });
  }

  // --------------------------------------------------
  // 4. Same year
  // --------------------------------------------------

  const years = new Set(
    rows
      .map(row => row.year)
      .filter(
        (year): year is number =>
          year !== undefined
      )
  );

  if (years.size > 1) {
    errors.push({
      code: "MIXED_YEAR",
      message:
        `Dataset contains multiple years: ${[
          ...years,
        ].join(", ")}.`,
    });
  }

  // --------------------------------------------------
  // 5. Don't allow future production years
  // --------------------------------------------------

  const currentYear = new Date().getUTCFullYear();

  for (const row of rows) {
    if (
      row.year !== undefined &&
      row.year > currentYear
    ) {
      errors.push({
        code: "FUTURE_YEAR",
        message:
          `"${row.name}" has future year ${row.year}.`,
        row,
      });
    }
  }

  // --------------------------------------------------
  // 6. Same metric
  // --------------------------------------------------

  const metrics = new Set(
    rows.map(row =>
      row.metric.trim().toLowerCase()
    )
  );

  if (metrics.size > 1) {
    errors.push({
      code: "METRIC_MISMATCH",
      message:
        `Dataset contains multiple metrics: ${[
          ...metrics,
        ].join(", ")}.`,
    });
  }

  // --------------------------------------------------
  // 7. Same unit
  // --------------------------------------------------

  const units = new Set(
    rows.map(row =>
      row.unit.trim().toLowerCase()
    )
  );

  if (units.size > 1) {
    errors.push({
      code: "UNIT_MISMATCH",
      message:
        `Dataset contains multiple units: ${[
          ...units,
        ].join(", ")}.`,
    });
  }

  // --------------------------------------------------
  // 8. Production basis
  // --------------------------------------------------

  const bases = new Set(
    rows
      .map(row => row.productionBasis)
      .filter(Boolean)
  );

  if (bases.size > 1) {
    errors.push({
      code: "MIXED_PRODUCTION_BASIS",
      message:
        `Dataset mixes production bases: ${[
          ...bases,
        ].join(", ")}.`,
    });
  }

  // --------------------------------------------------
  // 9. Status consistency
  // --------------------------------------------------

  const statuses = new Set(
    rows.map(row => row.status)
  );

 if (statuses.size > 1) {

  if (dataset.type === "ranking") {

    errors.push({
      code: "MIXED_STATUS",
      message:
        `Ranking dataset contains multiple data statuses: ${
          [...statuses].join(", ")
        }.`,
    });

  } else {

    warnings.push(
      `Dataset contains multiple data statuses: ${
        [...statuses].join(", ")
      }.`
    );
  }
}

  // --------------------------------------------------
  // 10. Duplicate names
  // --------------------------------------------------

  const names = new Map<string, number>();

  for (const row of rows) {
    const key = row.name
      .trim()
      .toLowerCase();

    names.set(
      key,
      (names.get(key) ?? 0) + 1
    );
  }

  for (const [name, count] of names) {
    if (count > 1) {
      errors.push({
        code: "DUPLICATE_NAME",
        message:
          `Duplicate entity "${name}" appears ${count} times.`,
      });
    }
  }

  // --------------------------------------------------
  // 11. Ranking validation
  // --------------------------------------------------

  if (dataset.type === "ranking") {
    const rankedRows = rows.filter(
      row => row.rank !== undefined
    );

    if (rankedRows.length !== rows.length) {
      warnings.push(
        "Ranking dataset contains rows without rank."
      );
    }

    const ranks = rankedRows.map(
      row => row.rank!
    );

    const uniqueRanks = new Set(ranks);

    if (uniqueRanks.size !== ranks.length) {
      errors.push({
        code: "RANK_ERROR",
        message:
          "Ranking dataset contains duplicate ranks.",
      });
    }

    // For production/revenue/market-cap/etc.
    // ranking should normally be descending.
    for (let i = 1; i < rankedRows.length; i++) {
      if (
        rankedRows[i].value >
        rankedRows[i - 1].value
      ) {
        errors.push({
          code: "RANK_ERROR",
          message:
            `Ranking order is incorrect between "${rankedRows[i - 1].name}" and "${rankedRows[i].name}".`,
        });

        break;
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export type FreshnessResult = {
  valid: boolean;
  requestedYear?: number;
  datasetYear?: number;
  datasetAsOf?: string;
  message?: string;
};

export function validateFreshness(
  dataset: CanonicalDataset,
  requestedYear?: number
): FreshnessResult {

  const currentYear = new Date().getUTCFullYear();

  const datasetYears = [
    ...new Set(
      dataset.rows
        .map(row => row.year)
        .filter(
          (year): year is number =>
            year !== undefined
        )
    ),
  ];

  if (!datasetYears.length) {
    return {
      valid: false,
      message: "Dataset has no year information.",
    };
  }

  const datasetYear = Math.max(...datasetYears);

  /*
   * --------------------------------------------------
   * 1. USER REQUESTED A SPECIFIC YEAR
   * --------------------------------------------------
   */

  if (requestedYear !== undefined) {

    if (datasetYear !== requestedYear) {
      return {
        valid: false,
        requestedYear,
        datasetYear,
        message:
          `Dataset year ${datasetYear} does not match requested year ${requestedYear}.`,
      };
    }

    return {
      valid: true,
      requestedYear,
      datasetYear,
      datasetAsOf:
        dataset.asOf ??
        getLatestAsOf(dataset),
    };
  }

  /*
   * --------------------------------------------------
   * 2. NEVER ACCEPT FUTURE DATA
   * --------------------------------------------------
   */

  if (datasetYear > currentYear) {
    return {
      valid: false,
      datasetYear,
      message:
        `Dataset contains future year ${datasetYear}.`,
    };
  }

  /*
   * --------------------------------------------------
   * 3. CURRENT YEAR
   *
   * Current-year actual/YTD/quarterly data is valid.
   * --------------------------------------------------
   */

  if (datasetYear === currentYear) {

    const currentRows = dataset.rows.filter(
      row => row.year === currentYear
    );

    const hasActualCurrentData =
      currentRows.some(
        row => row.status === "actual"
      );

    if (hasActualCurrentData) {
      return {
        valid: true,
        datasetYear,
        datasetAsOf:
          dataset.asOf ??
          getLatestAsOf(dataset),
      };
    }

    /*
     * Current-year forecast/guidance alone
     * is not considered latest actual data.
     */
    return {
      valid: false,
      datasetYear,
      message:
        `Dataset contains ${currentYear} data, but no actual current-year data was found.`,
    };
  }

  /*
   * --------------------------------------------------
   * 4. PREVIOUS COMPLETED YEAR
   *
   * Accept the latest completed annual dataset.
   * --------------------------------------------------
   */

  const latestCompletedYear = currentYear - 1;

  if (datasetYear === latestCompletedYear) {
    return {
      valid: true,
      datasetYear,
      datasetAsOf:
        dataset.asOf ??
        getLatestAsOf(dataset),
    };
  }

  /*
   * --------------------------------------------------
   * 5. OLDER DATA = OUTDATED
   * --------------------------------------------------
   */

  return {
    valid: false,
    datasetYear,
    message:
      `Dataset is outdated. Latest acceptable annual year is ${latestCompletedYear}, but dataset is ${datasetYear}.`,
  };
}


/**
 * Get the latest available source date.
 */
function getLatestAsOf(
  dataset: CanonicalDataset
): string | undefined {

  const dates = dataset.rows
    .map(row => row.asOf)
    .filter(
      (date): date is string =>
        Boolean(date)
    )
    .sort();

  return dates.at(-1);
}