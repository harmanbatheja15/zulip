import {$t_html} from "./i18n";
import type {InputPillContainer, InputPillItem} from "./input_pill";
import * as people from "./people";
import type {CombinedPillContainer, CombinedPillItem} from "./typeahead_helper";
import type {UserGroup} from "./user_groups";
import * as user_groups from "./user_groups";

export type UserGroupPill = {
    type: "user_group";
    group_id: number;
    group_name: string;
};

type UserGroupPillWidget = InputPillContainer<UserGroupPill>;

export type UserGroupPillData = UserGroup & {
    type: "user_group";
    is_silent?: boolean;
};

function display_pill(group: UserGroup): string {
    const group_members = get_group_members(group);
    return $t_html(
        {defaultMessage: "{group_name}: {group_size, plural, one {# user} other {# users}}"},
        {group_name: user_groups.get_display_group_name(group), group_size: group_members.length},
    );
}

export function create_item_from_group_name(
    group_name: string,
    current_items: CombinedPillItem[],
): InputPillItem<UserGroupPill> | undefined {
    group_name = group_name.trim();
    const group = user_groups.get_user_group_from_name(group_name);
    if (!group) {
        return undefined;
    }

    if (current_items.some((item) => item.type === "user_group" && item.group_id === group.id)) {
        return undefined;
    }

    return {
        type: "user_group",
        display_value: display_pill(group),
        group_id: group.id,
        group_name: group.name,
    };
}

export function get_group_name_from_item(item: InputPillItem<UserGroupPill>): string {
    return item.group_name;
}

export function get_user_ids(pill_widget: UserGroupPillWidget | CombinedPillContainer): number[] {
    let user_ids: number[] = [];
    for (const user_group_item of pill_widget.items()) {
        if (user_group_item.type === "user_group") {
            const user_group = user_groups.get_user_group_from_id(user_group_item.group_id);
            const group_members = get_group_members(user_group);
            user_ids.push(...group_members);
        }
    }

    user_ids = [...new Set(user_ids)];
    user_ids.sort((a, b) => a - b);

    return user_ids;
}

function get_group_members(user_group: UserGroup): number[] {
    const user_ids = [...user_groups.get_recursive_group_members(user_group)];
    return user_ids.filter((user_id) => people.is_person_active(user_id));
}

export function append_user_group(group: UserGroup, pill_widget: CombinedPillContainer): void {
    pill_widget.appendValidatedData({
        type: "user_group",
        display_value: display_pill(group),
        group_id: group.id,
        group_name: group.name,
    });
    pill_widget.clear_text();
}

export function get_group_ids(pill_widget: CombinedPillContainer): number[] {
    const items = pill_widget.items();
    return items.flatMap((item) => (item.type === "user_group" ? item.group_id : []));
}

export function filter_taken_groups(
    items: UserGroup[],
    pill_widget: CombinedPillContainer,
): UserGroup[] {
    const taken_group_ids = get_group_ids(pill_widget);
    items = items.filter((item) => !taken_group_ids.includes(item.id));
    return items;
}

export function typeahead_source(pill_widget: CombinedPillContainer): UserGroupPillData[] {
    const groups = user_groups.get_realm_user_groups();
    return filter_taken_groups(groups, pill_widget).map((user_group) => ({
        ...user_group,
        type: "user_group",
    }));
}
