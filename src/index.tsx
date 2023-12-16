import React, {toChildArray} from "preact"
import {createBrowserHistory, Update} from "history";
import {PropsWithChildren, cloneElement, useCallback} from "preact/compat";
import {useEffect} from "preact/compat";
import {signal} from "@preact/signals";
import classnames from "classnames";
import {URLPattern} from "urlpattern-polyfill";

const baseURL = window.location.protocol.concat('//').concat(window.location.host);
const history = createBrowserHistory();
const listenerSignal = signal(null);
const context = signal({
    currentChild: null,
    currentLocation: null,
    params: null
});

const setCurrentChild = (child: any) => {
    const {value} = context;
    context.value = {
        ...value,
        currentChild: child
    };
}

const setParams = (p: any) => {
    const {value} = context;
    context.value = {
        ...value,
        params: p
    };
}

const setCurrentLocation = (loc: any) => {
    const {value} = context;
    context.value = {
        ...value,
        currentLocation: loc
    };
}
export const useHistory = () => {
    return history;
}
export const useNavigate = () => {
    const h = useHistory();
    return (url: string) => {
        h.replace(url);
    }
}
export const useParams = () => {
    const { value } = context;
    return value.params;
}

const useChild = () => {
    const { value } = context;
    return value.currentChild;
}

const RouterImpl = (props: PropsWithChildren) => {
    const __currentChild = useChild();

    const updateView = useCallback((newLocation: string, children: React.ComponentChildren) => {
        if( children ) {
            const location = `${baseURL}${newLocation}`;
            const childList = toChildArray(children);
            let found = false;
            for(let i = 0; i < childList.length; i++) {
                const child = childList[i] as any;
                const pattern = new URLPattern({pathname: child.props.path, baseURL});
                const compiled = pattern.exec(location)
                if( compiled && child.props.path !== __currentChild?.path) {
                    found = true;
                    const clone = cloneElement(child, {...child.props, params: compiled.pathname.groups});

                    setParams(compiled.pathname.groups);
                    setCurrentLocation(newLocation);
                    setCurrentChild(clone);
                    break;
                }
            }

            if( !found ) {
                setCurrentChild(null);
            }
        }
    }, [])

    useEffect(() => {
        if( !listenerSignal.value ) {
            listenerSignal.value = history.listen((location: Update) => {
                updateView(location.location.pathname, props.children);
            });
            history.push(window.location.pathname);
        }
    }, [listenerSignal.value]);

    return __currentChild;
};

export const Router = (props: PropsWithChildren) => {
    return <RouterImpl>
            {props.children}
        </RouterImpl>
}

export const Link = (props: any) => {
    let className = classnames(props.className as string);
    const location = window.location.pathname;
    const navigate = useNavigate();

    if (location === props.href || location.startsWith(props.href as string)) {
        className = classnames(className, props.activeClassName);
    }

    return (
        <a
            href={props.href}
            className={className}
            onClick={(evt) => {
                evt.stopPropagation();
                evt.preventDefault();
                navigate(props.href as string);
            }}
        >
            {props.children}
        </a>
    );
};
