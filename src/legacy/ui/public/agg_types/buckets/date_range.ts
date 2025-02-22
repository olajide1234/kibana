/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import { get } from 'lodash';
import moment from 'moment-timezone';
import { i18n } from '@kbn/i18n';
import { npStart } from 'ui/new_platform';
import { BUCKET_TYPES } from './bucket_agg_types';
import { BucketAggType } from './_bucket_agg_type';
import { createFilterDateRange } from './create_filter/date_range';
import { AggConfig } from '../agg_config';
import { DateRangesParamEditor } from '../../vis/editors/default/controls/date_ranges';

// @ts-ignore
import { fieldFormats } from '../../registry/field_formats';
// @ts-ignore
import { dateRange } from '../../utils/date_range';
import { KBN_FIELD_TYPES } from '../../../../../plugins/data/common';

const dateRangeTitle = i18n.translate('common.ui.aggTypes.buckets.dateRangeTitle', {
  defaultMessage: 'Date Range',
});

export const dateRangeBucketAgg = new BucketAggType({
  name: BUCKET_TYPES.DATE_RANGE,
  title: dateRangeTitle,
  createFilter: createFilterDateRange,
  getKey(bucket, key, agg) {
    const formatter = agg.fieldOwnFormatter('text', fieldFormats.getDefaultInstance('date'));
    return dateRange.toString(bucket, formatter);
  },
  getFormat() {
    return fieldFormats.getDefaultInstance('string');
  },
  makeLabel(aggConfig) {
    return aggConfig.getFieldDisplayName() + ' date ranges';
  },
  params: [
    {
      name: 'field',
      type: 'field',
      filterFieldTypes: KBN_FIELD_TYPES.DATE,
      default(agg: AggConfig) {
        return agg.getIndexPattern().timeFieldName;
      },
    },
    {
      name: 'ranges',
      default: [
        {
          from: 'now-1w/w',
          to: 'now',
        },
      ],
      editorComponent: DateRangesParamEditor,
    },
    {
      name: 'time_zone',
      default: undefined,
      // Implimentation method is the same as that of date_histogram
      serialize: () => undefined,
      write: (agg: AggConfig, output: Record<string, any>) => {
        const field = agg.getParam('field');
        let tz = agg.getParam('time_zone');

        if (!tz && field) {
          tz = get(agg.getIndexPattern(), [
            'typeMeta',
            'aggs',
            'date_range',
            field.name,
            'time_zone',
          ]);
        }
        if (!tz) {
          const config = npStart.core.uiSettings;
          const detectedTimezone = moment.tz.guess();
          const tzOffset = moment().format('Z');
          const isDefaultTimezone = config.isDefault('dateFormat:tz');

          tz = isDefaultTimezone ? detectedTimezone || tzOffset : config.get('dateFormat:tz');
        }
        output.params.time_zone = tz;
      },
    },
  ],
});
