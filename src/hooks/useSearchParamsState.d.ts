type ValueType = 'string' | 'number' | 'boolean';
type DynamicType<V extends ValueType> = V extends 'number' ? number : V extends 'boolean' ? boolean : V extends 'string' ? string : never;
type ArrayableDynamicType<V extends ValueType, array extends boolean | undefined> = array extends true ? Array<DynamicType<V>> : DynamicType<V>;
type NullableArrayableDynamicType<V extends ValueType, required extends boolean | undefined, array extends boolean | undefined> = required extends true ? ArrayableDynamicType<V, array> : ArrayableDynamicType<V, array> | null;
type SearchParamStateType<V extends ValueType, required extends boolean | undefined, array extends boolean | undefined> = {
    array?: array;
    default: NullableArrayableDynamicType<V, required, array>;
    type: V;
    required?: required;
};
type SearchQueryTypeObject = Record<string, SearchParamStateType<ValueType, boolean | undefined, boolean | undefined>>;
type TypedRecord<T extends SearchQueryTypeObject> = {
    [K in keyof T]: NullableArrayableDynamicType<T[K]['type'], T[K]['required'], T[K]['array']>;
};
type UpdateValueType<T extends SearchQueryTypeObject, K extends keyof T> = T[K]['required'] extends true ? ArrayableDynamicType<T[K]['type'], T[K]['array']> : NullableArrayableDynamicType<T[K]['type'], T[K]['required'], T[K]['array']>;
/**
 * A hook that handles deconstructing, setting and typeing state values from url search params using react router's useSearchParams
 * @param props {anyKey: { array?: boolean; default: defaultValue, type: 'string' | 'number' | 'boolean'; required?: boolean;}}
 * @return [{allPropKeys: currentValue}, (propKey, typedNewValue) => updatesState, () => resetsStateToDefaults]
 */
declare const useSearchParamsState: <T extends SearchQueryTypeObject>(props: T) => [TypedRecord<T>, <K extends keyof T>(valueKey: K, newValue: UpdateValueType<T, K>) => void, () => void];
export default useSearchParamsState;
