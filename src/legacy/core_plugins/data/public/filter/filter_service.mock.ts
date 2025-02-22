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

import { FilterService, FilterStart, FilterSetup } from '.';

type FilterServiceClientContract = PublicMethodsOf<FilterService>;

const createSetupContractMock = () => {
  const setupContract: jest.Mocked<FilterSetup> = {
    filterManager: jest.fn() as any,
  };

  return setupContract;
};

const createStartContractMock = () => {
  const startContract: jest.Mocked<FilterStart> = {
    filterManager: jest.fn() as any,
  };

  return startContract;
};

const createMock = () => {
  const mocked: jest.Mocked<FilterServiceClientContract> = {
    setup: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
  };

  mocked.setup.mockReturnValue(createSetupContractMock());
  mocked.start.mockReturnValue(createStartContractMock());
  return mocked;
};

export const filterServiceMock = {
  create: createMock,
  createSetupContract: createSetupContractMock,
  createStartContract: createStartContractMock,
};
