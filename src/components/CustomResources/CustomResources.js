import React from 'react';
import * as jp from 'jsonpath';
import pluralize from 'pluralize';

import { EMPTY_TEXT_PLACEHOLDER } from 'shared/constants';
import { useCustomResourceUrl } from 'resources/CustomResourceDefinitions/useCustomResourceUrl';
import { ResourcesList } from 'shared/components/ResourcesList/ResourcesList';
import { CRCreate } from 'resources/CustomResourceDefinitions/CRCreate';
import { useUrl } from 'hooks/useUrl';

export function CustomResources({
  crd,
  version,
  showTitle = true,
  omitColumnsIds,
  hideCreateOption,
}) {
  const { group, names } = crd.spec;
  const name = names.plural;
  const customUrl = useCustomResourceUrl(crd);
  const { namespace } = useUrl();
  const resourceUrl =
    namespace && namespace !== '-all-'
      ? `/apis/${group}/${version.name}/namespaces/${namespace}/${name}`
      : `/apis/${group}/${version.name}/${name}`;

  const getJsonPath = (resource, jsonPath) => {
    const value =
      jp.value(resource, jsonPath.substring(1)) || EMPTY_TEXT_PLACEHOLDER;

    if (typeof value === 'boolean') {
      return value.toString();
    } else if (typeof value === 'object') {
      return JSON.stringify(value);
    } else {
      return value;
    }
  };

  const customColumns = version.additionalPrinterColumns?.map(column => ({
    header: column.name,
    value: resource => getJsonPath(resource, column.jsonPath),
  }));
  // CRD can have infinite number of additionalPrinterColumns what would be impossible to fit into the table
  if (customColumns?.length > 5) customColumns.length = 5;

  const params = {
    hasDetailsView: true,
    customUrl,
    resourceUrl,
    title: pluralize(crd.spec.names.kind),
    resourceType: crd.spec.names.kind,
    isCompact: true,
    showTitle,
    customColumns,
    testid: 'crd-custom-resources',
    omitColumnsIds,
    hideCreateOption,
    createResourceForm: props => <CRCreate {...props} crd={crd} />,
    resourceUrlPrefix: `/apis/${group}/${version.name}`,
    searchSettings: {
      textSearchProperties: ['metadata.namespace'],
      allowSlashShortcut: true,
    },
    namespace,
  };

  return <ResourcesList {...params} />;
}
