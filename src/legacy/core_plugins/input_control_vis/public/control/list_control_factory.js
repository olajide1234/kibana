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

import _ from 'lodash';
import {
  Control,
  noValuesDisableMsg,
  noIndexPatternMsg,
} from './control';
import { PhraseFilterManager } from './filter_manager/phrase_filter_manager';
import { createSearchSource } from './create_search_source';
import { i18n } from '@kbn/i18n';
import chrome from 'ui/chrome';
import { start as data } from '../../../../core_plugins/data/public/legacy';

function getEscapedQuery(query = '') {
  // https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-regexp-query.html#_standard_operators
  return query.replace(/[.?+*|{}[\]()"\\#@&<>~]/g, (match) => `\\${match}`);
}

const termsAgg = ({ field, size, direction, query }) => {
  const terms = {
    order: {
      _count: direction
    }
  };

  if (size) {
    terms.size = size < 1 ? 1 : size;
  }

  if (field.scripted) {
    terms.script = {
      source: field.script,
      lang: field.lang
    };
    terms.value_type = field.type === 'number' ? 'float' : field.type;
  } else {
    terms.field = field.name;
  }

  if (query) {
    terms.include = `.*${getEscapedQuery(query)}.*`;
  }

  return {
    termsAgg: {
      terms: terms
    }
  };
};

class ListControl extends Control {

  fetch = async (query) => {
    // Abort any in-progress fetch
    if (this.abortController) {
      this.abortController.abort();
    }
    this.abortController = new AbortController();

    const indexPattern = this.filterManager.getIndexPattern();
    if (!indexPattern) {
      this.disable(noIndexPatternMsg(this.controlParams.indexPattern));
      return;
    }

    let ancestorFilters;
    if (this.hasAncestors()) {
      if (this.hasUnsetAncestor()) {
        this.disable(i18n.translate('inputControl.listControl.disableTooltip', {
          defaultMessage: 'Disabled until \'{label}\' is set.',
          values: { label: this.ancestors[0].label }
        }));
        this.lastAncestorValues = undefined;
        return;
      }

      const ancestorValues = this.getAncestorValues();
      if (_.isEqual(ancestorValues, this.lastAncestorValues)
        && _.isEqual(query, this.lastQuery)) {
        // short circuit to avoid fetching options list for same ancestor values
        return;
      }
      this.lastAncestorValues = ancestorValues;
      this.lastQuery = query;

      ancestorFilters = this.getAncestorFilters();
    }

    const fieldName = this.filterManager.fieldName;
    const initialSearchSourceState = {
      timeout: `${chrome.getInjected('autocompleteTimeout')}ms`,
      terminate_after: chrome.getInjected('autocompleteTerminateAfter')
    };
    const aggs = termsAgg({
      field: indexPattern.fields.getByName(fieldName),
      size: this.options.dynamicOptions ? null : _.get(this.options, 'size', 5),
      direction: 'desc',
      query
    });
    const searchSource = createSearchSource(
      this.kbnApi,
      initialSearchSourceState,
      indexPattern,
      aggs,
      this.useTimeFilter,
      ancestorFilters
    );
    const abortSignal = this.abortController.signal;

    this.lastQuery = query;
    let resp;
    try {
      resp = await searchSource.fetch({ abortSignal });
    } catch(error) {
      // If the fetch was aborted then no need to surface this error in the UI
      if (error.name === 'AbortError') return;

      this.disable(i18n.translate('inputControl.listControl.unableToFetchTooltip', {
        defaultMessage: 'Unable to fetch terms, error: {errorMessage}',
        values: { errorMessage: error.message }
      }));
      return;
    }

    if (query && this.lastQuery !== query) {
      // search results returned out of order - ignore results from old query
      return;
    }

    const selectOptions = _.get(resp, 'aggregations.termsAgg.buckets', []).map((bucket) => {
      return bucket.key;
    });

    if(selectOptions.length === 0 && !query) {
      this.disable(noValuesDisableMsg(fieldName, indexPattern.title));
      return;
    }

    this.partialResults = resp.terminated_early || resp.timed_out;
    this.selectOptions = selectOptions;
    this.enable = true;
    this.disabledReason = '';
  }

  destroy() {
    if (this.abortController) this.abortController.abort();
  }

  hasValue() {
    return typeof this.value !== 'undefined' && this.value.length > 0;
  }
}

export async function listControlFactory(controlParams, kbnApi, useTimeFilter) {
  let indexPattern;
  try {
    indexPattern = await data.indexPatterns.indexPatterns.get(controlParams.indexPattern);

    // dynamic options are only allowed on String fields but the setting defaults to true so it could
    // be enabled for non-string fields (since UI input is hidden for non-string fields).
    // If field is not string, then disable dynamic options.
    const field = indexPattern.fields.find((field) => {
      return field.name === controlParams.fieldName;
    });
    if (field && field.type !== 'string') {
      controlParams.options.dynamicOptions = false;
    }
  } catch (err) {
    // ignore not found error and return control so it can be displayed in disabled state.
  }

  return new ListControl(
    controlParams,
    new PhraseFilterManager(controlParams.id, controlParams.fieldName, indexPattern, data.filter.filterManager),
    kbnApi,
    useTimeFilter
  );
}
