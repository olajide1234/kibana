/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { EuiIcon, EuiToolTip } from '@elastic/eui';
import moment from 'moment';
import React from 'react';
import { StaticIndexPattern } from 'ui/index_patterns';

import { hostsModel } from '../../../../store';
import { DragEffects, DraggableWrapper } from '../../../drag_and_drop/draggable_wrapper';
import { escapeDataProviderId } from '../../../drag_and_drop/helpers';
import { getEmptyTagValue } from '../../../empty_value';
import { PreferenceFormattedDate } from '../../../formatted_date';
import { HostDetailsLink } from '../../../links';
import { LocalizedDateTooltip } from '../../../localized_date_tooltip';
import { IS_OPERATOR } from '../../../timeline/data_providers/data_provider';
import { Provider } from '../../../timeline/data_providers/provider';
import { AddToKql, createFilter } from '../../add_to_kql';
import { HostsTableColumns } from './';

import * as i18n from './translations';

export const getHostsColumns = (
  type: hostsModel.HostsType,
  indexPattern: StaticIndexPattern
): HostsTableColumns => [
  {
    field: 'node.host.name',
    name: i18n.NAME,
    truncateText: false,
    hideForMobile: false,
    sortable: true,
    render: hostName => {
      if (hostName != null && hostName.length > 0) {
        const id = escapeDataProviderId(`hosts-table-hostName-${hostName[0]}`);
        return (
          <DraggableWrapper
            key={id}
            dataProvider={{
              and: [],
              enabled: true,
              excluded: false,
              id,
              name: hostName[0],
              kqlQuery: '',
              queryMatch: { field: 'host.name', value: hostName[0], operator: IS_OPERATOR },
            }}
            render={(dataProvider, _, snapshot) =>
              snapshot.isDragging ? (
                <DragEffects>
                  <Provider dataProvider={dataProvider} />
                </DragEffects>
              ) : (
                <AddToKql
                  id="global"
                  indexPattern={indexPattern}
                  filter={createFilter('host.name', hostName[0])}
                >
                  <HostDetailsLink hostName={hostName[0]} />
                </AddToKql>
              )
            }
          />
        );
      }
      return getEmptyTagValue();
    },
    width: '35%',
  },
  {
    field: 'node.lastSeen',
    name: (
      <EuiToolTip content={i18n.FIRST_LAST_SEEN_TOOLTIP}>
        <>
          {i18n.LAST_SEEN}{' '}
          <EuiIcon size="s" color="subdued" type="iInCircle" className="eui-alignTop" />
        </>
      </EuiToolTip>
    ),
    truncateText: false,
    hideForMobile: false,
    sortable: true,
    render: lastSeen => {
      if (lastSeen != null) {
        return (
          <LocalizedDateTooltip date={moment(new Date(lastSeen)).toDate()}>
            <PreferenceFormattedDate value={new Date(lastSeen)} />
          </LocalizedDateTooltip>
        );
      }
      return getEmptyTagValue();
    },
  },
  {
    field: 'node.host.os.name',
    name: i18n.OS,
    truncateText: false,
    hideForMobile: false,
    sortable: false,
    render: hostOsName => {
      if (hostOsName != null) {
        return (
          <AddToKql
            id="global"
            indexPattern={indexPattern}
            filter={createFilter('host.os.name', hostOsName)}
          >
            <>{hostOsName}</>
          </AddToKql>
        );
      }
      return getEmptyTagValue();
    },
  },
  {
    field: 'node.host.os.version',
    name: i18n.VERSION,
    truncateText: false,
    hideForMobile: false,
    sortable: false,
    render: hostOsVersion => {
      if (hostOsVersion != null) {
        return (
          <AddToKql
            id="global"
            indexPattern={indexPattern}
            filter={createFilter('host.os.version', hostOsVersion)}
          >
            <>{hostOsVersion}</>
          </AddToKql>
        );
      }
      return getEmptyTagValue();
    },
  },
];
