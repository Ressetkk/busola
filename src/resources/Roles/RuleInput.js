import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button, BusyIndicator } from 'fundamental-react';
import * as jp from 'jsonpath';
import { ResourceForm } from 'shared/ResourceForm';
import { ComboboxArrayInput, TextArrayInput } from 'shared/ResourceForm/fields';
import { Tooltip } from 'shared/components/Tooltip/Tooltip';
import { InvalidRoleError } from './InvalidRoleError';
import { useResourcesForApiGroups } from './useResourcesForApiGroups';
import {
  EMPTY_API_GROUP_KEY,
  getApiGroupInputOptions,
  unique,
} from './helpers';
import { useRecoilValue } from 'recoil';
import { activeNamespaceIdState } from 'state/activeNamespaceIdAtom';
import { groupVersionState } from 'state/discoverability/groupVersionsSelector';

const nonResourceUrls = [
  '/healthz/ready',
  '/api',
  '/api/*',
  '/apis',
  '/apis/*',
  '/healthz',
  '/livez',
  '/openapi',
  '/openapi/*',
  '/readyz',
  '/version',
  '/version/',
];

const verbs = [
  'get',
  'list',
  'watch',
  'create',
  'update',
  'patch',
  'delete',
  'deletecollection',
  '*',
];

export function RuleInput({ rule, rules, setRules, isAdvanced }) {
  const groupVersions = useRecoilValue(groupVersionState);
  const namespaceId = useRecoilValue(activeNamespaceIdState);
  const { t } = useTranslation();

  if (!Array.isArray(rule?.apiGroups)) {
    rule.apiGroups = [];
  }

  // dictionary of pairs (apiGroup: resources in that apiGroup)
  const apiRules = rule.apiGroups.flat();
  const {
    cache: resourcesCache,
    fetchResources,
    loadable,
    loading,
  } = useResourcesForApiGroups([...new Set(apiRules)]);
  // introduce special option for '' apiGroup - Combobox doesn't accept empty string key
  const apiGroupsInputOptions = getApiGroupInputOptions(groupVersions);

  // there's no endpoint for "all resources" - add just a '*' and specific resources
  // for already choosen apiGroups
  const getAvailableResources = resourcesCache =>
    unique([
      ...(rule.apiGroups
        .flatMap(apiGroup => resourcesCache[apiGroup] || [])
        .map(r => r.name) || []),
      '*',
    ]);
  const availableResources = getAvailableResources(resourcesCache);

  const addAllApiGroups = () => {
    jp.value(rule, '$.apiGroups', [
      '',
      ...apiGroupsInputOptions
        .map(g => g.key)
        .filter(k => k !== EMPTY_API_GROUP_KEY),
    ]);
    setRules([...rules]);
  };

  const addAllResources = () => {
    fetchResources()?.then(resourcesCache => {
      const availableResources = getAvailableResources(resourcesCache);
      jp.value(
        rule,
        '$.resources',
        availableResources.filter(r => r !== '*'),
      );
      setRules([...rules]);
    });
  };

  const addAllVerbs = () => {
    jp.value(
      rule,
      '$.verbs',
      verbs.filter(r => r !== '*'),
    );
    setRules([...rules]);
  };

  return (
    <ResourceForm.Wrapper
      isAdvanced={isAdvanced}
      resource={rule}
      setResource={() => setRules([...rules])}
    >
      <ComboboxArrayInput
        noEdit
        filterOptions
        title={t('roles.headers.api-groups')}
        propertyPath="$.apiGroups"
        options={apiGroupsInputOptions}
        emptyStringKey={EMPTY_API_GROUP_KEY}
        defaultOpen
        nestingLevel={2}
        actions={
          <Button
            compact
            glyph="add"
            onClick={addAllApiGroups}
            option="transparent"
            iconBeforeText
          >
            {t('roles.buttons.add-all')}
          </Button>
        }
      />
      <ComboboxArrayInput
        noEdit
        filterOptions
        title={t('roles.headers.resources')}
        propertyPath="$.resources"
        options={availableResources.map(i => ({ key: i, text: i }))}
        defaultOpen
        nestingLevel={2}
        newItemAction={
          loading ? (
            <BusyIndicator size="s" show={true} />
          ) : (
            <Tooltip content={t('roles.tooltips.load')}>
              <Button
                compact
                glyph="refresh"
                option="transparent"
                onClick={fetchResources}
                disabled={!loadable}
                ariaLabel={t('roles.buttons.load')}
              />
            </Tooltip>
          )
        }
        actions={[
          <Button
            compact
            glyph="add"
            option="transparent"
            onClick={addAllResources}
            disabled={loading || !apiRules?.length}
            iconBeforeText
          >
            {t('roles.buttons.add-all')}
          </Button>,
        ]}
      />
      <ComboboxArrayInput
        filterOptions
        title={t('roles.headers.verbs')}
        propertyPath="$.verbs"
        options={verbs.map(i => ({ key: i, text: i }))}
        defaultOpen
        nestingLevel={2}
        actions={[
          <Button
            compact
            glyph="add"
            onClick={addAllVerbs}
            option="transparent"
            iconBeforeText
          >
            {t('roles.buttons.add-all')}
          </Button>,
        ]}
      />
      {isAdvanced && (
        <TextArrayInput
          title={t('roles.headers.resource-names')}
          propertyPath="$.resourceNames"
          nestingLevel={2}
        />
      )}
      {isAdvanced && !namespaceId && (
        <ComboboxArrayInput
          title={t('roles.headers.non-resource-urls')}
          propertyPath="$.nonResourceURLs"
          nestingLevel={2}
          options={nonResourceUrls.map(i => ({ key: i, text: i }))}
        />
      )}
      <InvalidRoleError rule={rule} />
    </ResourceForm.Wrapper>
  );
}
