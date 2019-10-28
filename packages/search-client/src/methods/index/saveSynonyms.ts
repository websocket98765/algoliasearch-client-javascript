import { Method } from '@algolia/requester-types';
import { encode, WaitablePromise } from '@algolia/support';
import { mapRequestOptions, popRequestOption, RequestOptions } from '@algolia/transporter';

import { SearchIndex } from '../../SearchIndex';
import { SaveSynonymsOptions } from '../types/SaveSynonymsOptions';
import { SaveSynonymsResponse } from '../types/SaveSynonymsResponse';
import { Synonym } from '../types/Synonym';
import { HasWaitTask, waitTask } from './waitTask';

export const saveSynonyms = <TSearchIndex extends SearchIndex>(
  base: TSearchIndex
): TSearchIndex & HasWaitTask & HasSaveSynonyms => {
  return {
    ...waitTask(base),
    saveSynonyms(
      synonyms: readonly Synonym[],
      requestOptions?: SaveSynonymsOptions & RequestOptions
    ): Readonly<WaitablePromise<SaveSynonymsResponse>> {
      const forward = popRequestOption(requestOptions, 'forwardToReplicas', undefined);
      const replace = popRequestOption(requestOptions, 'replaceExistingSynonyms', undefined);
      const options = mapRequestOptions(requestOptions);
      if (forward === true) {
        // @ts-ignore
        // eslint-disable-next-line functional/immutable-data
        options.queryParameters.forwardToReplicas = '1';
      }

      if (replace === true) {
        // @ts-ignore
        // eslint-disable-next-line functional/immutable-data
        options.queryParameters.replaceExistingSynonyms = '1';
      }

      return WaitablePromise.from<SaveSynonymsResponse>(
        this.transporter.write<SaveSynonymsResponse>(
          {
            method: Method.Post,
            path: encode('1/indexes/%s/synonyms/batch', this.indexName),
            data: synonyms,
          },
          options
        )
      ).onWait((response, waitRequestOptions) =>
        this.waitTask(response.taskID, waitRequestOptions)
      );
    },
  };
};

export type HasSaveSynonyms = {
  readonly saveSynonyms: (
    synonyms: readonly Synonym[],
    requestOptions?: SaveSynonymsOptions & RequestOptions
  ) => Readonly<WaitablePromise<SaveSynonymsResponse>>;
};
