/*
 * Squidex Headless CMS
 *
 * @license
 * Copyright (c) Squidex UG (haftungsbeschränkt). All rights reserved.
 */

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { distinctUntilChanged, map, tap } from 'rxjs/operators';

import {
    DialogService,
    ImmutableArray,
    ResourceLinks,
    shareSubscribed,
    State
} from '@app/framework';

import { AppsState } from './apps.state';

import {
    RuleDto,
    RulesService,
    UpsertRuleDto
} from './../services/rules.service';

interface Snapshot {
    // The current rules.
    rules: RulesList;

    // The resource links.
    links: ResourceLinks;

    // Indicates if the rules are loaded.
    isLoaded?: boolean;
}

type RulesList = ImmutableArray<RuleDto>;

@Injectable()
export class RulesState extends State<Snapshot> {
    public rules =
        this.changes.pipe(map(x => x.rules),
            distinctUntilChanged());

    public isLoaded =
        this.changes.pipe(map(x => !!x.isLoaded),
            distinctUntilChanged());

    public canCreate =
        this.changes.pipe(map(x => x.links),
            distinctUntilChanged());

    constructor(
        private readonly appsState: AppsState,
        private readonly dialogs: DialogService,
        private readonly rulesService: RulesService
    ) {
        super({ rules: ImmutableArray.empty(), links: {} });
    }

    public load(isReload = false): Observable<any> {
        if (!isReload) {
            this.resetState();
        }

        return this.rulesService.getRules(this.appName).pipe(
            tap(({ items, _links: links }) => {
                if (isReload) {
                    this.dialogs.notifyInfo('Rules reloaded.');
                }

                this.next(s => {
                    const rules = ImmutableArray.of(items);

                    return { ...s, rules, isLoaded: true, links };
                });
            }),
            shareSubscribed(this.dialogs));
    }

    public create(request: UpsertRuleDto): Observable<RuleDto> {
        return this.rulesService.postRule(this.appName, request).pipe(
            tap(created => {
                this.next(s => {
                    const rules = s.rules.push(created);

                    return { ...s, rules };
                });
            }),
            shareSubscribed(this.dialogs));
    }

    public delete(rule: RuleDto): Observable<any> {
        return this.rulesService.deleteRule(this.appName, rule, rule.version).pipe(
            tap(() => {
                this.next(s => {
                    const rules = s.rules.removeAll(x => x.id === rule.id);

                    return { ...s, rules };
                });
            }),
            shareSubscribed(this.dialogs));
    }

    public updateAction(rule: RuleDto, action: any): Observable<RuleDto> {
        return this.rulesService.putRule(this.appName, rule, { action }, rule.version).pipe(
            tap(updated => {
                this.replaceRule(updated);
            }),
            shareSubscribed(this.dialogs));
    }

    public updateTrigger(rule: RuleDto, trigger: any): Observable<RuleDto> {
        return this.rulesService.putRule(this.appName, rule, { trigger }, rule.version).pipe(
            tap(updated => {
                this.replaceRule(updated);
            }),
            shareSubscribed(this.dialogs));
    }

    public enable(rule: RuleDto): Observable<any> {
        return this.rulesService.enableRule(this.appName, rule, rule.version).pipe(
            tap(updated => {
                this.replaceRule(updated);
            }),
            shareSubscribed(this.dialogs));
    }

    public disable(rule: RuleDto): Observable<any> {
        return this.rulesService.disableRule(this.appName, rule, rule.version).pipe(
            tap(updated => {
                this.replaceRule(updated);
            }),
            shareSubscribed(this.dialogs));
    }

    private replaceRule(rule: RuleDto) {
        this.next(s => {
            const rules = s.rules.replaceBy('id', rule);

            return { ...s, rules };
        });
    }

    private get appName() {
        return this.appsState.appName;
    }
}