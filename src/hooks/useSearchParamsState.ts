import { useCallback, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

// Define the types for the values that can be used
type DefaultType = string | number | boolean | Array<string | number | boolean> | null;
type ValueType = 'string' | 'number' | 'boolean';

// Define the type that transforms the value type to a specific type
type DynamicType<V extends ValueType> = V extends 'number'
	? number
	: V extends 'boolean'
	? boolean
	: V extends 'string'
	? string
	: never;

// Define the type that allows for arrays of the dynamic type
type ArrayableDynamicType<V extends ValueType, array extends boolean | undefined> = array extends true
	? Array<DynamicType<V>>
	: DynamicType<V>;

// Define the type that allows for nullable or non-nullable values
type NullableArrayableDynamicType<
	V extends ValueType,
	required extends boolean | undefined,
	array extends boolean | undefined
> = required extends true ? ArrayableDynamicType<V, array> : ArrayableDynamicType<V, array> | null;

// Define the type for the state of a search parameter
type SearchParamStateType<
	V extends ValueType,
	required extends boolean | undefined,
	array extends boolean | undefined
> = {
	array?: array;
	default: NullableArrayableDynamicType<V, required, array>;
	type: V;
	required?: required;
};

// Define the type for the query object that holds all the search parameter definitions
type SearchQueryTypeObject = Record<
	string,
	SearchParamStateType<ValueType, boolean | undefined, boolean | undefined>
>;

// Define the type for a record that is dynamically typed based on the type definitions
type TypedRecord<T extends SearchQueryTypeObject> = {
	[K in keyof T]: NullableArrayableDynamicType<T[K]['type'], T[K]['required'], T[K]['array']>;
};

// Define the type for the value that can be passed to the update function
type UpdateValueType<T extends SearchQueryTypeObject, K extends keyof T> = T[K]['required'] extends true
	? ArrayableDynamicType<T[K]['type'], T[K]['array']>
	: NullableArrayableDynamicType<T[K]['type'], T[K]['required'], T[K]['array']>;

// Function to transform a value to a string representation
const transformToStringRepresentation = (value: DefaultType): string | string[] | undefined => {
	if (value !== null) {
		if (Array.isArray(value)) {
			return value.map((val) => val.toString());
		} else {
			return value.toString();
		}
	}
};

// Function to transform a string to a declared type
const transformToDeclaredType = (value: string, type: ValueType): DefaultType => {
	switch (type) {
		case 'number':
			return Number(value);
		case 'boolean':
			return value === 'true';
		case 'string':
		default:
			return value;
	}
};

/**
 * A hook that handles deconstructing, setting and typeing state values from url search params using react router's useSearchParams
 * @param props {anyKey: { array?: boolean; default: defaultValue, type: 'string' | 'number' | 'boolean'; required?: boolean;}}
 * @return [{allPropKeys: currentValue}, (propKey, typedNewValue) => updatesState, () => resetsStateToDefaults]
 */
const useSearchParamsState = <T extends SearchQueryTypeObject>(
	props: T
): [TypedRecord<T>, <K extends keyof T>(valueKey: K, newValue: UpdateValueType<T, K>) => void, () => void] => {
	const [searchParams, setSearchParams] = useSearchParams();
    // Hacky way of checking if any params already exist in the current route, we therefore don't want to overwrite with defaults
    const anyParams = useMemo(() => Object.keys(props).some((key) => searchParams.get(key) !== null), [props, searchParams])
	const getValueFromParams = (
		key: string,
		typeDefinition: SearchParamStateType<ValueType, boolean | undefined, boolean | undefined>,
		searchParams: URLSearchParams,
		loadDefaults: boolean
	): NullableArrayableDynamicType<ValueType, boolean | undefined, boolean | undefined> => {
		if (loadDefaults) return typeDefinition.default;
		const firstValue = searchParams.get(key);
		if (firstValue === null) return typeDefinition.required ? typeDefinition.default : null;
		if (typeDefinition.array) {
			return searchParams
				.getAll(key)
				.map((val) => transformToDeclaredType(val, typeDefinition.type))
				.filter((val): val is Exclude<DefaultType, null> => val !== null) as NullableArrayableDynamicType<
				ValueType,
				boolean | undefined,
				boolean | undefined
			>; // Type guard to filter out nulls
		}
		return transformToDeclaredType(firstValue, typeDefinition.type);
	};

	// Memoize the search state
	const searchState = useMemo(() => {
		return Object.fromEntries(
			Object.entries(props).map(([k, v]) => [k, getValueFromParams(k, v, searchParams, !anyParams)])
		) as TypedRecord<T>;
	}, [searchParams, props]);

	// Function to update the search state
	const updateFunction = <K extends keyof T>(valueKey: K, newValue: UpdateValueType<T, K>): void => {
		const newState: Record<string, string | string[]> = {};
		Object.entries({ ...searchState }).forEach(([k, v]) => {
			let queryValue = v;
			if (k === valueKey) {
				queryValue = newValue;
			}
			const transformedValue = transformToStringRepresentation(queryValue);
			if (transformedValue) newState[k] = transformedValue;
		});
		setSearchParams(newState);
	};

	// Memoize the update function
	const updateSearchState = useCallback(updateFunction, [searchState, setSearchParams]);
	const setToDefault = () => {
		const defaultValues: Record<string, string | string[]> = {};
		Object.entries(props).forEach(([k, v]) => {
			const defaultVal = transformToStringRepresentation(v.default);
			if (defaultVal) {
				defaultValues[k] = defaultVal;
			}
		});
		if (Object.keys(defaultValues).length) {
			setSearchParams(defaultValues, { replace: true });
		}
	};
	// Effect to set default values if no search params are present
	useEffect(() => {
		if (!location.search?.length) {
			setToDefault();
		}
	}, []);

	return [searchState, updateSearchState, setToDefault];
};

export default useSearchParamsState;