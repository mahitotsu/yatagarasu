<script setup lang="ts">
const route = useRoute();
let id = route.query.id;
const { data: decision, refresh } = await useFetch('/api/decisions/get', { method: 'POST', body: { id: id } });

const save = async () => {
    const { data } = await useFetch('/api/decisions/save', { method: 'POST', body: decision });
    if (data && data.value) {
        id = data.value.id;
    }
    await refresh();
}
</script>

<template>
    <NuxtLink to="./list-decisions">
        <button>List</button>
    </NuxtLink>
    <button v-if="decision" @click="save()">Save</button>
    <button v-if="decision?.created">Delete</button>
    <form v-if="decision">
        <div>
            <label>Title</label>
            <input type="text" v-model="decision.title" />
        </div>
        <div>
            <label>Context</label>
            <textarea v-model="decision.consequences"></textarea>
        </div>
        <div>
            <label>Decision</label>
            <textarea v-model="decision.decision"></textarea>
        </div>
        <div>
            <label>Consequences</label>
            <textarea v-model="decision.consequences"></textarea>
        </div>
        <div>
            <table>
                <thead>
                    <tr>
                        <th>created</th>
                        <th>modified</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>{{ decision.created ?? '-' }}</td>
                        <td>{{ decision.modified ?? '-' }}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </form>
</template>