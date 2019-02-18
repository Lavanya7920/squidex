/*
 * Squidex Headless CMS
 *
 * @license
 * Copyright (c) Squidex UG (haftungsbeschränkt). All rights reserved.
 */

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ApiUrlConfig, pretifyError } from '@app/framework';

export class FeatureDto {
    constructor(
        public readonly name: string,
        public readonly text: string
    ) {
    }
}

export class FeaturesDto {
    constructor(
        public readonly features: FeatureDto[],
        public readonly version: number
    ) {
    }
}

@Injectable()
export class NewsService {
    constructor(
        private readonly http: HttpClient,
        private readonly apiUrl: ApiUrlConfig
    ) {
    }

    public getFeatures(version: number): Observable<FeaturesDto> {
        const url = this.apiUrl.buildUrl(`api/news/features?version=${version}`);

        return this.http.get<any>(url).pipe(
                map(response => {
                    const items: any[] = response.features;

                    return new FeaturesDto(
                        items.map(item => {
                            return new FeatureDto(
                                item.name,
                                item.text
                            );
                        }),
                        response.version
                    );
                }),
                pretifyError('Failed to load features. Please reload.'));
    }
}