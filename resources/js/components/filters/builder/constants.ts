import { FilterOperator } from '@/types';

export const operatorLabels: Record<FilterOperator, string> = {
    equals: 'Equals',
    not_equals: 'Not equals',
    contains: 'Contains',
    not_contains: 'Does not contain',
    starts_with: 'Starts with',
    ends_with: 'Ends with',
    in: 'Is one of',
    not_in: 'Is not one of',
    gt: 'Greater than',
    gte: 'Greater than or equal',
    lt: 'Less than',
    lte: 'Less than or equal',
    exists: 'Exists',
    not_exists: 'Does not exist',
    regex: 'Matches regex',
    is_empty: 'Is empty',
    is_not_empty: 'Is not empty',
};

export const operatorsForType: Record<string, FilterOperator[]> = {
    text: ['equals', 'not_equals', 'contains', 'not_contains', 'starts_with', 'ends_with', 'in', 'not_in', 'regex', 'is_empty', 'is_not_empty', 'exists', 'not_exists'],
    textarea: ['equals', 'not_equals', 'contains', 'not_contains', 'starts_with', 'ends_with', 'regex', 'is_empty', 'is_not_empty', 'exists', 'not_exists'],
    number: ['equals', 'not_equals', 'gt', 'gte', 'lt', 'lte', 'in', 'not_in', 'exists', 'not_exists'],
    boolean: ['equals', 'not_equals', 'exists', 'not_exists'],
    date: ['equals', 'not_equals', 'gt', 'gte', 'lt', 'lte', 'exists', 'not_exists'],
    datetime: ['equals', 'not_equals', 'gt', 'gte', 'lt', 'lte', 'exists', 'not_exists'],
    time: ['equals', 'not_equals', 'gt', 'gte', 'lt', 'lte', 'exists', 'not_exists'],
    select: ['equals', 'not_equals', 'in', 'not_in', 'is_empty', 'is_not_empty', 'exists', 'not_exists'],
    multi_select: ['contains', 'not_contains', 'equals', 'not_equals', 'in', 'not_in', 'is_empty', 'is_not_empty', 'exists', 'not_exists'],
    email: ['equals', 'not_equals', 'contains', 'not_contains', 'starts_with', 'ends_with', 'is_empty', 'is_not_empty', 'exists', 'not_exists'],
    url: ['equals', 'not_equals', 'contains', 'not_contains', 'starts_with', 'ends_with', 'is_empty', 'is_not_empty', 'exists', 'not_exists'],
};

export const operatorsRequiringNoValue: FilterOperator[] = ['exists', 'not_exists', 'is_empty', 'is_not_empty'];
export const operatorsRequiringArrayValue: FilterOperator[] = ['in', 'not_in'];

