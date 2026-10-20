# Object walk tests

Pins for object-literal walking. Flat objects emit exact keys, nested conditions keep raw whens, unlowerable conditions stay exact, holes emit nothing, spreads and computed keys stay dynamic, and `r` objects and custom props take their own shapes — one parsed snippet per walk rule.
