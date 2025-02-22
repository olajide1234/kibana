/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { EuiHorizontalRule, EuiSpacer, EuiFlexItem } from '@elastic/eui';
import React, { useCallback, useEffect } from 'react';
import { connect } from 'react-redux';
import { StickyContainer } from 'react-sticky';

import { FiltersGlobal } from '../../../components/filters_global';
import { HeaderPage } from '../../../components/header_page';
import { LastEventTime } from '../../../components/last_event_time';
import { AnomalyTableProvider } from '../../../components/ml/anomaly/anomaly_table_provider';
import { networkToCriteria } from '../../../components/ml/criteria/network_to_criteria';
import { scoreIntervalToDateTime } from '../../../components/ml/score/score_interval_to_datetime';
import { AnomaliesNetworkTable } from '../../../components/ml/tables/anomalies_network_table';
import { manageQuery } from '../../../components/page/manage_query';
import { FlowTargetSelectConnected } from '../../../components/page/network/flow_target_select_connected';
import { IpOverview } from '../../../components/page/network/ip_overview';
import { SiemSearchBar } from '../../../components/search_bar';
import { IpOverviewQuery } from '../../../containers/ip_overview';
import { indicesExistOrDataTemporarilyUnavailable, WithSource } from '../../../containers/source';
import { FlowTargetSourceDest, LastEventIndexKey } from '../../../graphql/types';
import { decodeIpv6 } from '../../../lib/helpers';
import { convertToBuildEsQuery } from '../../../lib/keury';
import { ConditionalFlexGroup } from '../../../pages/network/navigation/conditional_flex_group';
import { networkModel, networkSelectors, State, inputsSelectors } from '../../../store';
import { setAbsoluteRangeDatePicker as dispatchAbsoluteRangeDatePicker } from '../../../store/inputs/actions';
import { setIpDetailsTablesActivePageToZero as dispatchIpDetailsTablesActivePageToZero } from '../../../store/network/actions';
import { SpyRoute } from '../../../utils/route/spy_routes';
import { NetworkEmptyPage } from '../network_empty_page';

import { IPDetailsComponentProps } from './types';
export { getBreadcrumbs } from './utils';
import { TlsQueryTable } from './tls_query_table';
import { UsersQueryTable } from './users_query_table';
import { NetworkTopNFlowQueryTable } from './network_top_n_flow_query_table';
import { NetworkTopCountriesQueryTable } from './network_top_countries_query_table';

const IpOverviewManage = manageQuery(IpOverview);

export const IPDetailsComponent = React.memo<IPDetailsComponentProps>(
  ({
    detailName,
    filters,
    flowTarget,
    from,
    isInitializing,
    query,
    setAbsoluteRangeDatePicker,
    setIpDetailsTablesActivePageToZero,
    setQuery,
    to,
  }) => {
    const narrowDateRange = useCallback(
      (score, interval) => {
        const fromTo = scoreIntervalToDateTime(score, interval);
        setAbsoluteRangeDatePicker({
          id: 'global',
          from: fromTo.from,
          to: fromTo.to,
        });
      },
      [scoreIntervalToDateTime, setAbsoluteRangeDatePicker]
    );

    useEffect(() => {
      setIpDetailsTablesActivePageToZero(null);
    }, [detailName]);

    return (
      <>
        <WithSource sourceId="default" data-test-subj="ip-details-page">
          {({ indicesExist, indexPattern }) => {
            const ip = decodeIpv6(detailName);
            const filterQuery = convertToBuildEsQuery({
              indexPattern,
              queries: [query],
              filters,
            });
            return indicesExistOrDataTemporarilyUnavailable(indicesExist) ? (
              <StickyContainer>
                <FiltersGlobal>
                  <SiemSearchBar indexPattern={indexPattern} id="global" />
                </FiltersGlobal>

                <HeaderPage
                  data-test-subj="ip-details-headline"
                  subtitle={<LastEventTime indexKey={LastEventIndexKey.ipDetails} ip={ip} />}
                  title={ip}
                  draggableArguments={{ field: `${flowTarget}.ip`, value: ip }}
                >
                  <FlowTargetSelectConnected />
                </HeaderPage>

                <IpOverviewQuery
                  skip={isInitializing}
                  sourceId="default"
                  filterQuery={filterQuery}
                  type={networkModel.NetworkType.details}
                  ip={ip}
                >
                  {({ id, inspect, ipOverviewData, loading, refetch }) => (
                    <AnomalyTableProvider
                      criteriaFields={networkToCriteria(detailName, flowTarget)}
                      startDate={from}
                      endDate={to}
                      skip={isInitializing}
                    >
                      {({ isLoadingAnomaliesData, anomaliesData }) => (
                        <IpOverviewManage
                          id={id}
                          inspect={inspect}
                          ip={ip}
                          data={ipOverviewData}
                          anomaliesData={anomaliesData}
                          loading={loading}
                          isLoadingAnomaliesData={isLoadingAnomaliesData}
                          type={networkModel.NetworkType.details}
                          flowTarget={flowTarget}
                          refetch={refetch}
                          setQuery={setQuery}
                          startDate={from}
                          endDate={to}
                          narrowDateRange={(score, interval) => {
                            const fromTo = scoreIntervalToDateTime(score, interval);
                            setAbsoluteRangeDatePicker({
                              id: 'global',
                              from: fromTo.from,
                              to: fromTo.to,
                            });
                          }}
                        />
                      )}
                    </AnomalyTableProvider>
                  )}
                </IpOverviewQuery>

                <EuiHorizontalRule />

                <ConditionalFlexGroup direction="column">
                  <EuiFlexItem>
                    <NetworkTopNFlowQueryTable
                      endDate={to}
                      filterQuery={filterQuery}
                      flowTarget={FlowTargetSourceDest.source}
                      ip={ip}
                      skip={isInitializing}
                      startDate={from}
                      type={networkModel.NetworkType.details}
                      setQuery={setQuery}
                      indexPattern={indexPattern}
                    />
                  </EuiFlexItem>

                  <EuiFlexItem>
                    <NetworkTopNFlowQueryTable
                      endDate={to}
                      flowTarget={FlowTargetSourceDest.destination}
                      filterQuery={filterQuery}
                      ip={ip}
                      skip={isInitializing}
                      startDate={from}
                      type={networkModel.NetworkType.details}
                      setQuery={setQuery}
                      indexPattern={indexPattern}
                    />
                  </EuiFlexItem>
                </ConditionalFlexGroup>

                <EuiSpacer />

                <ConditionalFlexGroup direction="column">
                  <EuiFlexItem>
                    <NetworkTopCountriesQueryTable
                      endDate={to}
                      filterQuery={filterQuery}
                      flowTarget={FlowTargetSourceDest.source}
                      ip={ip}
                      skip={isInitializing}
                      startDate={from}
                      type={networkModel.NetworkType.details}
                      setQuery={setQuery}
                      indexPattern={indexPattern}
                    />
                  </EuiFlexItem>

                  <EuiFlexItem>
                    <NetworkTopCountriesQueryTable
                      endDate={to}
                      flowTarget={FlowTargetSourceDest.destination}
                      filterQuery={filterQuery}
                      ip={ip}
                      skip={isInitializing}
                      startDate={from}
                      type={networkModel.NetworkType.details}
                      setQuery={setQuery}
                      indexPattern={indexPattern}
                    />
                  </EuiFlexItem>
                </ConditionalFlexGroup>

                <EuiSpacer />

                <UsersQueryTable
                  endDate={to}
                  filterQuery={filterQuery}
                  flowTarget={flowTarget}
                  ip={ip}
                  skip={isInitializing}
                  startDate={from}
                  type={networkModel.NetworkType.details}
                  setQuery={setQuery}
                />

                <EuiSpacer />

                <TlsQueryTable
                  endDate={to}
                  filterQuery={filterQuery}
                  flowTarget={(flowTarget as unknown) as FlowTargetSourceDest}
                  ip={ip}
                  setQuery={setQuery}
                  skip={isInitializing}
                  startDate={from}
                  type={networkModel.NetworkType.details}
                />

                <EuiSpacer />

                <AnomaliesNetworkTable
                  startDate={from}
                  endDate={to}
                  skip={isInitializing}
                  ip={ip}
                  type={networkModel.NetworkType.details}
                  flowTarget={flowTarget}
                  narrowDateRange={narrowDateRange}
                />
              </StickyContainer>
            ) : (
              <>
                <HeaderPage title={ip} />

                <NetworkEmptyPage />
              </>
            );
          }}
        </WithSource>
        <SpyRoute />
      </>
    );
  }
);

IPDetailsComponent.displayName = 'IPDetailsComponent';

const makeMapStateToProps = () => {
  const getGlobalQuerySelector = inputsSelectors.globalQuerySelector();
  const getGlobalFiltersQuerySelector = inputsSelectors.globalFiltersQuerySelector();
  const getIpDetailsFlowTargetSelector = networkSelectors.ipDetailsFlowTargetSelector();
  return (state: State) => ({
    query: getGlobalQuerySelector(state),
    filters: getGlobalFiltersQuerySelector(state),
    flowTarget: getIpDetailsFlowTargetSelector(state),
  });
};

export const IPDetails = connect(
  makeMapStateToProps,
  {
    setAbsoluteRangeDatePicker: dispatchAbsoluteRangeDatePicker,
    setIpDetailsTablesActivePageToZero: dispatchIpDetailsTablesActivePageToZero,
  }
)(IPDetailsComponent);
